"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  cartApi,
  emptyCartResponse,
  emptyCartSummaryResponse,
  type CartResponse,
  type CartSummaryResponse,
} from "@/entities/cart";
import { isApiErrorStatus } from "@/shared/api";
import { AuthGuard, clearStoredAuth, Container, getLoginRedirectHref } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CartView } from "./CartView";

interface CartPageState {
  cart: CartResponse;
  summary: CartSummaryResponse;
  status: "loading" | "ready" | "error";
}

export const CartPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<CartPageState>({
    cart: emptyCartResponse,
    summary: emptyCartSummaryResponse,
    status: "loading",
  });

  useEffect(() => {
    let isActive = true;

    const loadCart = async (): Promise<void> => {
      try {
        const [cart, summary] = await Promise.all([cartApi.get(), cartApi.getSummary()]);

        if (isActive) {
          setState({ cart, summary, status: "ready" });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isApiErrorStatus(error, 401)) {
          clearStoredAuth();
          router.replace(getLoginRedirectHref(pathname || "/cart"));
          return;
        }

        setState((currentState) => ({ ...currentState, status: "error" }));
      }
    };

    void loadCart();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  return (
    <AuthGuard>
      <Header />
      {state.status === "ready" ? (
        <CartView initialCart={state.cart} initialSummary={state.summary} />
      ) : (
        <CartPageStateView status={state.status} />
      )}
      <Footer />
    </AuthGuard>
  );
};

interface CartPageStateViewProps {
  status: "loading" | "error";
}

const CartPageStateView = ({ status }: CartPageStateViewProps) => {
  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-10 md:py-14">
        <section className="border-border max-w-2xl rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
          <h1 className="text-text-primary text-3xl font-bold">
            {status === "loading" ? "Загружаем корзину" : "Не удалось загрузить корзину"}
          </h1>
          <p className="text-text-secondary mt-4 leading-7">
            {status === "loading"
              ? "Получаем актуальный состав корзины и итоговую сумму."
              : "Попробуйте обновить страницу или войти заново."}
          </p>
        </section>
      </Container>
    </main>
  );
};
