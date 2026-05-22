"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authApi } from "@/entities/auth";
import { profileApi, type ProfileSummaryResponse } from "@/entities/profile";
import { userApi, type UserMeResponse } from "@/entities/user";
import { isApiErrorStatus } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileView } from "./ProfileView";

interface ProfilePageState {
  profile: ProfileSummaryResponse | null;
  user: UserMeResponse | null;
  status: "loading" | "ready" | "unauthorized" | "error";
}

const getStoredAccessToken = (): string | null => {
  return (
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token")
  );
};

export const ProfilePage = () => {
  const [state, setState] = useState<ProfilePageState>({
    profile: null,
    user: null,
    status: "loading",
  });

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      setState({ profile: null, user: null, status: "unauthorized" });
      return;
    }

    let isActive = true;

    const loadProfile = async (): Promise<void> => {
      try {
        await authApi.getMe(accessToken);

        const [profile, user] = await Promise.all([
          profileApi.getSummary(accessToken),
          userApi.getMe(accessToken),
        ]);

        if (isActive) {
          setState({ profile, user, status: "ready" });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isApiErrorStatus(error, 401)) {
          window.localStorage.removeItem("access_token");
          window.localStorage.removeItem("refresh_token");
          window.sessionStorage.removeItem("access_token");
          window.sessionStorage.removeItem("refresh_token");
          setState({ profile: null, user: null, status: "unauthorized" });
          return;
        }

        setState({ profile: null, user: null, status: "error" });
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const content =
    state.status === "ready" && state.profile && state.user ? (
      <ProfileView profile={state.profile} user={state.user} />
    ) : (
      <ProfileStateView status={state.status === "ready" ? "error" : state.status} />
    );

  return (
    <>
      <Header />
      {content}
      <Footer />
    </>
  );
};

interface ProfileStateViewProps {
  status: Exclude<ProfilePageState["status"], "ready">;
}

const ProfileStateView = ({ status }: ProfileStateViewProps) => {
  const title =
    status === "loading"
      ? "Загружаем профиль"
      : status === "unauthorized"
        ? "Войдите в аккаунт"
        : "Не удалось загрузить профиль";

  const text =
    status === "loading"
      ? "Проверяем авторизацию и получаем данные личного кабинета."
      : status === "unauthorized"
        ? "Личный кабинет доступен после входа."
        : "Попробуйте обновить страницу или войти заново.";

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-10 md:py-14">
        <section className="border-border max-w-2xl rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
          <h1 className="text-text-primary text-3xl font-bold">{title}</h1>
          <p className="text-text-secondary mt-4 leading-7">{text}</p>
          {status === "loading" ? null : (
            <Link
              className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-7 inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition"
              href={ROUTES.LOGIN}
            >
              Перейти ко входу
            </Link>
          )}
        </section>
      </Container>
    </main>
  );
};
