"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { orderApi, type OrderDetailResponse, type OrderStatusResponse } from "@/entities/order";
import { paymentApi, type PaymentDetailResponse } from "@/entities/payment";
import { isApiErrorStatus } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import {
  AuthGuard,
  Button,
  clearStoredAuth,
  Container,
  getLoginRedirectHref,
  getStoredAccessToken,
} from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CheckoutSuccessView } from "./CheckoutSuccessView";

interface CheckoutSuccessPageProps {
  orderId: number | null;
  paymentId: number | null;
}

interface SuccessState {
  order: OrderDetailResponse | null;
  payment: PaymentDetailResponse | null;
  status: OrderStatusResponse | null;
  viewStatus: "loading" | "ready" | "error" | "not_found";
  errorMessage?: string;
}

export const CheckoutSuccessPage = ({ orderId, paymentId }: CheckoutSuccessPageProps) => {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [state, setState] = useState<SuccessState>({
    order: null,
    payment: null,
    status: null,
    viewStatus: "loading",
  });

  useEffect(() => {
    // Notify that cart was checked out and is now empty
    notifyCartChanged({ itemsCount: 0 });

    if (!orderId) {
      setState((prev) => ({ ...prev, viewStatus: "not_found" }));
      return;
    }

    const token = getStoredAccessToken();
    if (!token) {
      return;
    }

    let isMounted = true;

    const loadOrderData = async () => {
      try {
        const [order, status] = await Promise.all([
          orderApi.getById(orderId, token),
          orderApi.getStatus(orderId, token),
        ]);

        let payment: PaymentDetailResponse | null = null;
        const targetPaymentId = paymentId || order.payment?.id;
        if (targetPaymentId) {
          try {
            payment = await paymentApi.getById(targetPaymentId, token);
          } catch {
            // payment details are optional for display
          }
        }

        if (isMounted) {
          setState({
            order,
            payment,
            status,
            viewStatus: "ready",
          });
        }
      } catch (err) {
        if (!isMounted) return;

        if (isApiErrorStatus(err, 401)) {
          clearStoredAuth();
          router.replace(getLoginRedirectHref(pathname || `/checkout/success?order_id=${orderId}`));
          return;
        }

        setState({
          order: null,
          payment: null,
          status: null,
          viewStatus: "error",
          errorMessage: "Не удалось загрузить данные оформленного заказа",
        });
      }
    };

    void loadOrderData();

    return () => {
      isMounted = false;
    };
  }, [orderId, paymentId, pathname, router]);

  const renderContent = () => {
    if (state.viewStatus === "loading") {
      return (
        <main className="min-h-[70vh] py-16 flex items-center justify-center bg-slate-50/50">
          <Container className="max-w-md text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Загрузка информации о заказе...</h2>
            <p className="mt-1.5 text-xs text-slate-500">Пожалуйста, подождите несколько секунд</p>
          </Container>
        </main>
      );
    }

    if (state.viewStatus === "not_found") {
      return (
        <main className="bg-bg-primary min-h-[70vh]">
          <Container className="py-12 md:py-16">
            <section className="border border-slate-200/80 bg-white shadow-soft max-w-xl mx-auto rounded-3xl p-8 text-center space-y-4">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertCircle size={32} />
              </div>
              <h1 className="text-2xl font-black text-slate-900">Заказ не выбран</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Номер заказа не указан в строке адреса. Вы можете посмотреть свои заказы в личном кабинете.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href={ROUTES.PROFILE_ORDERS}>
                  <Button className="cursor-pointer gap-2" type="button">
                    <span>Мои заказы</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
                <Link href={ROUTES.CATALOG}>
                  <Button variant="secondary" className="cursor-pointer" type="button">
                    В каталог
                  </Button>
                </Link>
              </div>
            </section>
          </Container>
        </main>
      );
    }

    if (state.viewStatus === "error" || !state.order || !state.status) {
      return (
        <main className="bg-bg-primary min-h-[70vh]">
          <Container className="py-12 md:py-16">
            <section className="border border-rose-100 bg-white shadow-soft max-w-xl mx-auto rounded-3xl p-8 text-center space-y-4">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertCircle size={32} />
              </div>
              <h1 className="text-2xl font-black text-slate-900">Заказ оформлен</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                {state.errorMessage || "Ваш заказ успешно принят в обработку. Вы можете отслеживать его статус в личном кабинете."}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href={ROUTES.PROFILE_ORDERS}>
                  <Button className="cursor-pointer gap-2" type="button">
                    <span>Перейти к заказам</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
                <Link href={ROUTES.HOME}>
                  <Button variant="secondary" className="cursor-pointer" type="button">
                    На главную
                  </Button>
                </Link>
              </div>
            </section>
          </Container>
        </main>
      );
    }

    return <CheckoutSuccessView order={state.order} payment={state.payment} status={state.status} />;
  };

  return (
    <AuthGuard>
      <Header />
      {renderContent()}
      <Footer />
    </AuthGuard>
  );
};
