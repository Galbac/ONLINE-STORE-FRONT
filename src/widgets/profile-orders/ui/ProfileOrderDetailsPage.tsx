"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { orderApi, type OrderDetailResponse, type OrderStatusResponse } from "@/entities/order";
import { paymentApi, type PaymentDetailResponse } from "@/entities/payment";
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
import { ProfileOrderDetailsView } from "./ProfileOrderDetailsView";

interface ProfileOrderDetailsPageProps {
  orderId: number;
}

interface ProfileOrderDetailsPageState {
  order: OrderDetailResponse | null;
  payment: PaymentDetailResponse | null;
  status: OrderStatusResponse | null;
  viewStatus: "loading" | "ready" | "error";
}

export const ProfileOrderDetailsPage = ({ orderId }: ProfileOrderDetailsPageProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<ProfileOrderDetailsPageState>({
    order: null,
    payment: null,
    status: null,
    viewStatus: "loading",
  });

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      return;
    }

    let isActive = true;

    const loadOrder = async (): Promise<void> => {
      try {
        const [order, status] = await Promise.all([
          orderApi.getById(orderId, accessToken),
          orderApi.getStatus(orderId, accessToken),
        ]);
        const payment = order.payment
          ? await paymentApi.getById(order.payment.id, accessToken)
          : null;

        if (isActive) {
          setState({ order, payment, status, viewStatus: "ready" });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isApiErrorStatus(error, 401)) {
          clearStoredAuth();
          router.replace(getLoginRedirectHref(pathname || `/profile/orders/${orderId}`));
          return;
        }

        setState((currentState) => ({ ...currentState, viewStatus: "error" }));
      }
    };

    void loadOrder();

    return () => {
      isActive = false;
    };
  }, [orderId, pathname, router]);

  const content =
    state.viewStatus === "ready" && state.order && state.status ? (
      <ProfileOrderDetailsView
        initialOrder={state.order}
        initialPayment={state.payment}
        initialStatus={state.status}
      />
    ) : (
      <ProfileOrderDetailsStateView
        status={state.viewStatus === "ready" ? "error" : state.viewStatus}
      />
    );

  return (
    <AuthGuard>
      <Header />
      {content}
      <Footer />
    </AuthGuard>
  );
};

interface ProfileOrderDetailsStateViewProps {
  status: "loading" | "error";
}

const ProfileOrderDetailsStateView = ({ status }: ProfileOrderDetailsStateViewProps) => {
  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-10 md:py-14">
        <section className="border-border max-w-2xl rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
          <h1 className="text-text-primary text-3xl font-bold">
            {status === "loading" ? "Загружаем заказ" : "Не удалось загрузить заказ"}
          </h1>
          <p className="text-text-secondary mt-4 leading-7">
            {status === "loading"
              ? "Получаем детали заказа и статус оплаты."
              : "Попробуйте обновить страницу или войти заново."}
          </p>
        </section>
      </Container>
    </main>
  );
};
