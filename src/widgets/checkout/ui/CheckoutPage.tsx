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
import { profileApi, type AddressListResponse } from "@/entities/profile";
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
        const [cart, summary, addresses, deliveryOptions, pickupPoints] = await Promise.all([
          cartApi.get(),
          cartApi.getSummary(),
          profileApi.getAddresses(accessToken),
          deliveryApi.getOptions(),
          deliveryApi.getPickupPoints(),
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
      />
    ) : (
      <CheckoutPageStateView status={state.status === "ready" ? "error" : state.status} />
    );

  return (
    <AuthGuard>
      <Header />
      {content}
      <Footer />
    </AuthGuard>
  );
};

interface CheckoutPageStateViewProps {
  status: "loading" | "error";
}

const CheckoutPageStateView = ({ status }: CheckoutPageStateViewProps) => {
  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-10 md:py-14">
        <section className="border-border max-w-2xl rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
          <h1 className="text-text-primary text-3xl font-bold">
            {status === "loading" ? "Готовим оформление" : "Не удалось открыть оформление"}
          </h1>
          <p className="text-text-secondary mt-4 leading-7">
            {status === "loading"
              ? "Получаем корзину, адреса и доступные способы доставки."
              : "Попробуйте обновить страницу или войти заново."}
          </p>
        </section>
      </Container>
    </main>
  );
};

const createDeliveryCalculationFallback = (
  summary: CartSummaryResponse,
  deliveryOptions: DeliveryOptionsResponse,
): DeliveryCalculateResponse => {
  return {
    amount_left_for_free_delivery: null,
    available: deliveryOptions.delivery.enabled,
    delivery_price: summary.delivery_price ?? deliveryOptions.delivery.base_price ?? null,
    free_delivery_from: deliveryOptions.delivery.free_from_amount ?? null,
    message: deliveryOptions.delivery.description ?? deliveryOptions.delivery.title,
    min_order_amount: deliveryOptions.delivery.min_order_amount ?? null,
    zone: null,
  };
};
