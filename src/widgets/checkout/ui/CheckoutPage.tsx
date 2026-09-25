"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cartApi, type CartResponse, type CartSummaryResponse } from "@/entities/cart";
import {
  deliveryApi,
  type DeliveryCalculateResponse,
  type DeliveryOptionsResponse,
  type DeliveryTimeSlotsResponse,
  type PickupPointListResponse,
} from "@/entities/delivery";
import { profileApi, type AddressListResponse, type ProfileUserResponse } from "@/entities/profile";
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
import { CheckoutView } from "./CheckoutView";

interface CheckoutPageState {
  addresses: AddressListResponse | null;
  cart: CartResponse | null;
  deliveryCalculation: DeliveryCalculateResponse | null;
  deliveryOptions: DeliveryOptionsResponse | null;
  pickupPoints: PickupPointListResponse | null;
  summary: CartSummaryResponse | null;
  timeSlots: DeliveryTimeSlotsResponse | null;
  user: ProfileUserResponse | null;
  status: "loading" | "ready" | "error";
}

export const CheckoutPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<CheckoutPageState>({
    addresses: null,
    cart: null,
    deliveryCalculation: null,
    deliveryOptions: null,
    pickupPoints: null,
    summary: null,
    timeSlots: null,
    user: null,
    status: "loading",
  });

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      return;
    }

    let isActive = true;

    const loadCheckout = async (): Promise<void> => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [cart, summary, addresses, deliveryOptions, pickupPoints, profileSummary] = await Promise.all([
          cartApi.get(),
          cartApi.getSummary(),
          profileApi.getAddresses(accessToken),
          deliveryApi.getOptions(),
          deliveryApi.getPickupPoints(),
          profileApi.getSummary(accessToken).catch(() => null),
        ]);

        const defaultAddress =
          addresses.items.find((address) => address.is_default) ?? addresses.items[0];
        const defaultPickupPoint = pickupPoints.items[0];

        const deliveryCalculation = createDeliveryCalculationFallback(summary, deliveryOptions);
        const timeSlots = await deliveryApi.getTimeSlots({
          date: today,
          delivery_type: "delivery",
          address_id: defaultAddress?.id ?? null,
          city: defaultAddress?.city ?? defaultPickupPoint?.city ?? null,
        });

        if (isActive) {
          setState({
            addresses,
            cart,
            deliveryCalculation,
            deliveryOptions,
            pickupPoints,
            summary,
            timeSlots,
            user: profileSummary?.user ?? null,
            status: "ready",
          });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isApiErrorStatus(error, 401)) {
          clearStoredAuth();
          router.replace(getLoginRedirectHref(pathname || "/checkout"));
          return;
        }

        setState((currentState) => ({ ...currentState, status: "error" }));
      }
    };

    void loadCheckout();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  const {
    addresses,
    cart,
    deliveryCalculation,
    deliveryOptions,
    pickupPoints,
    summary,
    timeSlots,
    user,
  } = state;

  const content =
    state.status === "ready" &&
    addresses &&
    cart &&
    deliveryCalculation &&
    deliveryOptions &&
    pickupPoints &&
    summary &&
    timeSlots ? (
      <CheckoutView
        addresses={addresses}
        cart={cart}
        deliveryCalculation={deliveryCalculation}
        deliveryOptions={deliveryOptions}
        pickupPoints={pickupPoints}
        summary={summary}
        timeSlots={timeSlots}
        currentUser={user}
      />
    ) : state.status === "loading" ? (
      <CheckoutSkeleton />
    ) : (
      <CheckoutErrorView />
    );

  return (
    <AuthGuard>
      <Header />
      {content}
      <Footer />
    </AuthGuard>
  );
};

const CheckoutSkeleton = () => {
  return (
    <main className="bg-bg-primary min-h-[75vh] py-8">
      <Container className="max-w-7xl">
        <div className="mb-6 h-4 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="mb-8 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs animate-pulse">
                <div className="mb-4 flex items-center gap-3">
                  <div className="size-8 rounded-full bg-slate-200" />
                  <div className="h-5 w-48 rounded bg-slate-200" />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="h-11 w-full rounded-xl bg-slate-100" />
                  <div className="h-11 w-3/4 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs animate-pulse h-96">
            <div className="mb-4 h-6 w-32 rounded bg-slate-200" />
            <div className="space-y-4 pt-4">
              <div className="h-16 w-full rounded-xl bg-slate-100" />
              <div className="h-16 w-full rounded-xl bg-slate-100" />
              <div className="h-12 w-full rounded-xl bg-emerald-100" />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
};

const CheckoutErrorView = () => {
  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-10 md:py-14">
        <section className="border-border max-w-2xl rounded-2xl border bg-white p-6 shadow-xs md:p-9">
          <h1 className="text-text-primary text-2xl font-bold">Не удалось открыть оформление заказа</h1>
          <p className="text-text-secondary mt-3 text-sm leading-relaxed">
            Возникла ошибка при получении корзины или доступных способов доставки. Попробуйте обновить страницу.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Обновить страницу
          </button>
        </section>
      </Container>
    </main>
  );
};

const createDeliveryCalculationFallback = (
  summary: CartSummaryResponse,
  deliveryOptions: DeliveryOptionsResponse,
): DeliveryCalculateResponse => {
  const freeFrom = Number(deliveryOptions.delivery.free_from_amount ?? 3000);
  const subtotal = Number(summary.subtotal || summary.final_price || 0);
  const amountLeft = Math.max(0, freeFrom - subtotal);

  return {
    amount_left_for_free_delivery: amountLeft > 0 ? String(amountLeft) : "0",
    available: deliveryOptions.delivery.enabled,
    delivery_price: summary.delivery_price ?? deliveryOptions.delivery.base_price ?? "199.00",
    free_delivery_from: String(freeFrom),
    message: deliveryOptions.delivery.description ?? deliveryOptions.delivery.title,
    min_order_amount: deliveryOptions.delivery.min_order_amount ?? "1000.00",
    zone: {
      id: 1,
      name: "Кизляр — Центральный",
      city: "Кизляр",
      price: deliveryOptions.delivery.base_price ?? "199.00",
      free_delivery_from: String(freeFrom),
      min_order_amount: deliveryOptions.delivery.min_order_amount ?? "1000.00",
    } as any,
  };
};
