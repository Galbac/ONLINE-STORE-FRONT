"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/entities/auth";
import { profileApi, type ProfileSummaryResponse } from "@/entities/profile";
import { userApi, type UserMeResponse } from "@/entities/user";
import { isApiErrorStatus } from "@/shared/api";
import {
  AuthGuard,
  clearStoredAuth,
  Container,
  getLoginRedirectHref,
  getStoredAccessToken,
} from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileView } from "./ProfileView";

interface ProfilePageState {
  profile: ProfileSummaryResponse | null;
  user: UserMeResponse | null;
  status: "loading" | "ready" | "unauthorized" | "error";
}

export const ProfilePage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<ProfilePageState>({
    profile: null,
    user: null,
    status: "loading",
  });

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
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
          clearStoredAuth();
          setState({ profile: null, user: null, status: "unauthorized" });
          router.replace(getLoginRedirectHref(pathname || "/profile"));
          return;
        }

        setState({ profile: null, user: null, status: "error" });
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  const content =
    state.status === "ready" && state.profile && state.user ? (
      <ProfileView profile={state.profile} user={state.user} />
    ) : (
      <ProfileStateView status={state.status === "ready" ? "error" : state.status} />
    );

  return (
    <AuthGuard>
      <Header />
      {content}
      <Footer />
    </AuthGuard>
  );
};

interface ProfileStateViewProps {
  status: Exclude<ProfilePageState["status"], "ready">;
}

const ProfileStateView = ({ status }: ProfileStateViewProps) => {
  if (status === "unauthorized") {
    return null;
  }

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-10 md:py-14">
        <section className="border-border max-w-2xl rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
          <h1 className="text-text-primary text-3xl font-bold">
            {status === "loading" ? "Загружаем профиль" : "Не удалось загрузить профиль"}
          </h1>
          <p className="text-text-secondary mt-4 leading-7">
            {status === "loading"
              ? "Проверяем авторизацию и получаем данные личного кабинета."
              : "Попробуйте обновить страницу или войти заново."}
          </p>
        </section>
      </Container>
    </main>
  );
};
