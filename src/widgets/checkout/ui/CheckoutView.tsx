"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Calendar,
  Check,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import type { CartItemResponse, CartResponse, CartSummaryResponse } from "@/entities/cart";
import { useStoreBranch } from "@/entities/delivery";
import {
  deliveryApi,
  type DeliveryCalculateResponse,
  type DeliveryOptionsResponse,
  type DeliveryTimeSlotResponse,
  type DeliveryTimeSlotsResponse,
  type PickupPointListResponse,
} from "@/entities/delivery";
import { orderApi, type OrderCreateRequest, type OrderCreateResponse } from "@/entities/order";
import { paymentApi, type PaymentCreateResponse } from "@/entities/payment";
import type { AddressListResponse, AddressResponse } from "@/entities/profile";
import { useDynamicStoreInfo } from "@/entities/settings";
import { userApi, type UserMeResponse } from "@/entities/user";
import { extractErrorMessage } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";
import {
  formatPhoneMask,
  handlePhoneInputChange,
  normalizePhoneNumber,
} from "@/shared/lib/format/phone";
import { Button, Container } from "@/shared/ui";
import { PhoneVerificationModal } from "@/widgets/profile/ui/PhoneVerificationModal";

interface CheckoutViewProps {
  isRepricing?: boolean;
  addresses: AddressListResponse;
  cart: CartResponse;
  deliveryCalculation: DeliveryCalculateResponse;
  deliveryOptions: DeliveryOptionsResponse;
  pickupPoints: PickupPointListResponse;
  summary: CartSummaryResponse;
  timeSlots: DeliveryTimeSlotsResponse;
  currentUser?: UserMeResponse | null | undefined;
}

interface ContactState {
  name: string;
  phone: string;
  email: string;
}

type DeliveryType = "delivery" | "pickup";
type PaymentMethod = "online" | "on_delivery";

export const CheckoutView = ({
  isRepricing = false,
  addresses,
  cart,
  deliveryCalculation,
  deliveryOptions,
  pickupPoints,
  summary,
  timeSlots,
  currentUser,
}: CheckoutViewProps) => {
  const { isMaintenance, statusText } = useDynamicStoreInfo();
  const defaultAddress =
    addresses.items.find((address) => address.is_default) ?? addresses.items[0];
  const { selectedStore } = useStoreBranch();
  const defaultPickupPoint =
    (selectedStore && pickupPoints.items.find((point) => point.id === selectedStore.id)) ??
    pickupPoints.items[0];

  const [slotsData, setSlotsData] = useState<DeliveryTimeSlotsResponse>(timeSlots);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const isInitialSlotsMount = useRef(true);

  const firstAvailableSlot = useMemo(() => {
    return slotsData.items.find((slot) => slot.available) ?? slotsData.items[0] ?? null;
  }, [slotsData.items]);

  // Автозаполнение известных данных пользователя
  const [contact, setContact] = useState<ContactState>({
    name: currentUser?.name || "",
    phone: currentUser?.phone ? formatPhoneMask(currentUser.phone) : "",
    email: currentUser?.email || "",
  });

  useEffect(() => {
    if (currentUser) {
      setContact((prev) => ({
        name: prev.name || currentUser.name || "",
        phone: prev.phone || (currentUser.phone ? formatPhoneMask(currentUser.phone) : ""),
        email: prev.email || currentUser.email || "",
      }));
    }
  }, [currentUser]);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? null);
  const [activeCalculation, setActiveCalculation] =
    useState<DeliveryCalculateResponse>(deliveryCalculation);

  useEffect(() => {
    setActiveCalculation(deliveryCalculation);
  }, [deliveryCalculation]);

  const [selectedPickupPointId, setSelectedPickupPointId] = useState(
    defaultPickupPoint?.id ?? null,
  );
  const [selectedDate, setSelectedDate] = useState(timeSlots.date);
  const [selectedSlotId, setSelectedSlotId] = useState(firstAvailableSlot?.id ?? null);
  const [order, setOrder] = useState<OrderCreateResponse | null>(null);
  const [payment, setPayment] = useState<PaymentCreateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const orderRequestRef = useRef<{ key: string; payload: string } | null>(null);

  const selectedAddress = useMemo(() => {
    return addresses.items.find((address) => address.id === selectedAddressId) ?? defaultAddress;
  }, [addresses.items, defaultAddress, selectedAddressId]);

  useEffect(() => {
    let isActive = true;
    if (
      deliveryType === "delivery" &&
      selectedAddress &&
      !isRepricing &&
      Number(summary.final_price) >= Number(deliveryOptions.delivery.min_order_amount || 0)
    ) {
      const cartAmount = summary.final_price || summary.subtotal || 0;
      deliveryApi
        .calculate({
          delivery_type: "delivery",
          order_amount: cartAmount,
          cart_total: cartAmount,
          address_id: selectedAddress.id,
          city: selectedAddress.city,
        })
        .then((calc) => {
          if (calc && isActive) {
            setActiveCalculation(calc);
          }
        })
        .catch(() => {});
    }
    return () => {
      isActive = false;
    };
  }, [
    selectedAddress,
    deliveryType,
    summary.final_price,
    summary.subtotal,
    deliveryOptions.delivery.min_order_amount,
    isRepricing,
  ]);

  useEffect(() => {
    if (selectedStore && pickupPoints.items.some((point) => point.id === selectedStore.id)) {
      setSelectedPickupPointId(selectedStore.id);
    }
  }, [selectedStore, pickupPoints.items]);

  const selectedPickupPoint = useMemo(() => {
    return (
      pickupPoints.items.find((point) => point.id === selectedPickupPointId) ?? defaultPickupPoint
    );
  }, [defaultPickupPoint, pickupPoints.items, selectedPickupPointId]);

  const selectedSlot = useMemo(() => {
    return slotsData.items.find((slot) => slot.id === selectedSlotId) ?? firstAvailableSlot;
  }, [firstAvailableSlot, selectedSlotId, slotsData.items]);

  // Динамическая подгрузка слотов при смене типа доставки, даты или точки получения
  useEffect(() => {
    if (isInitialSlotsMount.current) {
      isInitialSlotsMount.current = false;
      if (deliveryType === "delivery" && selectedDate === timeSlots.date) {
        return;
      }
    }

    let isActive = true;
    setIsLoadingSlots(true);

    const loadSlots = async () => {
      try {
        const res = await deliveryApi.getTimeSlots({
          date: selectedDate,
          delivery_type: deliveryType,
          pickup_point_id: deliveryType === "pickup" ? (selectedPickupPointId ?? null) : null,
          address_id: deliveryType === "delivery" ? (selectedAddressId ?? null) : null,
          city:
            deliveryType === "delivery"
              ? (selectedAddress?.city ?? null)
              : (selectedPickupPoint?.city ?? null),
        });

        if (isActive && res) {
          setSlotsData(res);
          const firstAvail = res.items.find((s) => s.available) ?? res.items[0];
          setSelectedSlotId((prevId) => {
            const isPrevValid = res.items.some((s) => s.id === prevId && s.available);
            return isPrevValid ? prevId : (firstAvail?.id ?? null);
          });
        }
      } catch (err) {
        console.error("Не удалось обновить временные интервалы:", err);
      } finally {
        if (isActive) {
          setIsLoadingSlots(false);
        }
      }
    };

    void loadSlots();

    return () => {
      isActive = false;
    };
  }, [
    deliveryType,
    selectedDate,
    selectedPickupPointId,
    selectedAddressId,
    selectedAddress?.city,
    selectedPickupPoint?.city,
    timeSlots.date,
  ]);

  const isOutsideKizlyar = useMemo(() => {
    if (deliveryType !== "delivery" || !selectedAddress) return false;
    const rawCity = (selectedAddress.city || "").trim().toLowerCase();
    const cleanCity = rawCity.replace(/^(?:г\.|г|город|пос\.|пос|поселок)\s*/i, "").trim();
    if (!cleanCity) return false;
    const isKizlyarArea =
      cleanCity.includes("кизляр") ||
      cleanCity.includes("черёмушки") ||
      cleanCity.includes("черемушки") ||
      cleanCity.includes("южный") ||
      cleanCity.includes("комсомольский") ||
      cleanCity.includes("первомайское") ||
      cleanCity.includes("кардоновка") ||
      cleanCity.includes("бабах-юрт");
    return !isKizlyarArea;
  }, [deliveryType, selectedAddress]);

  const itemsCount = cart.items.filter((item) => item.is_available).length;
  const itemsTotal = Number(summary.final_price || summary.subtotal || 0);
  const freeFrom = Number(
    activeCalculation?.free_delivery_from ?? deliveryOptions?.delivery?.free_from_amount ?? 3000,
  );
  const isFreeDelivery = freeFrom > 0 && itemsTotal >= freeFrom;

  const deliveryPrice =
    deliveryType === "pickup"
      ? "0"
      : isFreeDelivery
        ? "0"
        : activeCalculation.delivery_price && activeCalculation.delivery_price !== "0"
          ? activeCalculation.delivery_price
          : (deliveryOptions.delivery.base_price ?? "199.00");
  const minOrderAmount = Number(
    activeCalculation.min_order_amount || deliveryOptions.delivery.min_order_amount || 1000,
  );
  const isMinOrderMet =
    itemsCount > 0 && (deliveryType === "pickup" || itemsTotal >= minOrderAmount);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const contactErrors = {
    name: contact.name.trim().length < 2,
    phone: !/^\+7\d{10}$/.test(normalizePhoneNumber(contact.phone)),
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()),
  };
  const locationError = deliveryType === "delivery" ? !selectedAddress?.id : !selectedPickupPoint?.id;
  const timeError = !selectedDate || !selectedSlot?.available || isLoadingSlots;

  const handleContactChange = (field: keyof ContactState, value: string): void => {
    let nextValue = value;
    if (field === "phone") {
      nextValue = handlePhoneInputChange(value, contact.phone);
    }
    setContact((current) => ({
      ...current,
      [field]: nextValue,
    }));
  };

  const handleCreateOrder = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setIsSubmitted(true);
    if (Object.values(contactErrors).some(Boolean) || locationError || timeError) {
      setErrorMessage("Заполните обязательные поля, выделенные красным.");
      const invalidSection = Object.values(contactErrors).some(Boolean) ? 1 : locationError ? 3 : 4;
      document.getElementById(`checkout-step-${invalidSection}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (isRepricing) {
      setErrorMessage("Дождитесь пересчёта корзины для выбранного магазина");
      return;
    }
    setErrorMessage(null);

    if (marketingConsent && !currentUser?.marketing_consent) {
      userApi.updateMarketingConsent(true).catch(() => {});
    }

    const resolvedSlotId = selectedSlot?.available ? selectedSlot.id : null;

    if (!resolvedSlotId) {
      setErrorMessage("Выберите доступный интервал времени.");
      return;
    }

    const request: OrderCreateRequest = {
      expected_cart_total: String(summary.final_price),
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      customer_name: contact.name,
      customer_phone: normalizePhoneNumber(contact.phone),
      customer_email: contact.email || null,
      delivery_date: selectedDate,
      delivery_time_slot_id: resolvedSlotId,
      comment: null,
      use_points: 0,
      apartment: selectedAddress?.apartment ?? null,
      entrance: selectedAddress?.entrance ?? null,
      floor: selectedAddress?.floor ?? null,
      intercom: selectedAddress?.intercom ?? null,
    };

    const minAmount = activeCalculation.min_order_amount
      ? Number(activeCalculation.min_order_amount)
      : deliveryOptions.delivery.min_order_amount
        ? Number(deliveryOptions.delivery.min_order_amount)
        : 0;

    if (minAmount > 0 && Number(summary.final_price) < minAmount) {
      setErrorMessage(`Минимальная сумма заказа для оформления: ${minAmount} ₽.`);
      return;
    }

    if (deliveryType === "delivery") {
      if (!selectedAddress?.id) {
        setErrorMessage("Пожалуйста, выберите или добавьте адрес доставки.");
        return;
      }
      request.address_id = selectedAddress.id;
      request.pickup_point_id = selectedStore?.id ?? null;
    } else {
      if (!selectedPickupPoint?.id) {
        setErrorMessage("Пожалуйста, выберите пункт выдачи заказа.");
        return;
      }
      request.address_id = null;
      request.pickup_point_id = selectedPickupPoint.id;
    }

    if (itemsCount === 0) {
      setErrorMessage("Ваша корзина пуста. Пожалуйста, добавьте товары из каталога.");
      return;
    }

    if (!isMinOrderMet) {
      setErrorMessage(
        `Минимальная сумма заказа для доставки — ${minOrderAmount} ₽. Добавьте товаров еще на ${minOrderAmount - itemsTotal} ₽.`,
      );
      return;
    }

    if (deliveryType === "delivery" && isOutsideKizlyar) {
      setErrorMessage(
        "К сожалению, по данному адресу доставка не осуществляется. Доступен только самовывоз в г. Кизляр.",
      );
      return;
    }

    startTransition(async () => {
      try {
        const payload = JSON.stringify({
          request,
          items: cart.items.map((item) => ({
            id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
        });
        const storageKey = `grocery-pending-order:${contact.phone}:${selectedStore?.id ?? selectedPickupPoint?.id ?? "default"}`;
        let stored = orderRequestRef.current;
        try {
          stored = JSON.parse(sessionStorage.getItem(storageKey) || "null") as typeof stored;
        } catch {
          /* Storage may be unavailable. */
        }
        const pendingRequest =
          stored?.payload === payload
            ? stored
            : {
                key:
                  window.crypto?.randomUUID?.() ??
                  `ord_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                payload,
              };
        orderRequestRef.current = pendingRequest;
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(pendingRequest));
        } catch {
          /* Keep the in-memory key. */
        }
        const createdOrder = await orderApi.create(request, pendingRequest.key);
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* The order is already persisted. */
        }
        orderRequestRef.current = null;
        setOrder(createdOrder);
        notifyCartChanged({ itemsCount: 0 });

        let createdPaymentId: number | null = null;
        if (paymentMethod === "online") {
          try {
            const createdPayment = await paymentApi.create({ order_id: createdOrder.id });
            setPayment(createdPayment);
            createdPaymentId = createdPayment.id;
          } catch {
            // Оплата может быть продолжена со страницы успеха
          }
        }

        const successParams = new URLSearchParams();
        successParams.set("order_id", String(createdOrder.id));
        if (createdPaymentId) {
          successParams.set("payment_id", String(createdPaymentId));
        }
        router.push(`${ROUTES.CHECKOUT_SUCCESS}?${successParams.toString()}`);
      } catch (err: any) {
        if (err?.message?.includes("PHONE_VERIFICATION_REQUIRED") || err?.status === 403) {
          setIsVerifyModalOpen(true);
          setErrorMessage("Необходимо подтвердить номер телефона по SMS перед созданием заказа.");
        } else if (err?.data?.items && Array.isArray(err.data.items)) {
          const itemErrors = err.data.items
            .map(
              (i: { name?: string; reason?: string; available_quantity?: number | string }) =>
                `${i.name || "Товар"}: ${i.reason || "недоступен"}${i.available_quantity !== undefined ? ` (осталось: ${i.available_quantity})` : ""}`,
            )
            .join(", ");
          setErrorMessage(`Некоторые позиции не могут быть заказаны: ${itemErrors}`);
        } else {
          setErrorMessage(
            extractErrorMessage(
              err,
              "Не удалось создать заказ. Проверьте данные и попробуйте еще раз.",
            ),
          );
        }
      }
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.CART}>
            Корзина
          </Link>
          <span>/</span>
          <span>Оформление заказа</span>
        </nav>

        <h1 className="text-text-primary mb-7 text-4xl font-bold md:text-5xl">Оформление заказа</h1>

        {isMaintenance ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-900">
            <AlertCircle className="shrink-0 text-amber-600" size={20} />
            <span>
              {statusText || "Магазин закрыт на техническое обслуживание"}. Оформление заказов
              временно приостановлено.
            </span>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-5 grid gap-5 sm:mt-8 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_390px]"
          noValidate
          onSubmit={handleCreateOrder}
        >
          <div className="min-w-0 space-y-4">
            <CheckoutSection icon={<UserRound size={24} />} number={1} title="Контактные данные">
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Имя"
                  error={isSubmitted && contactErrors.name}
                  value={contact.name}
                  onChange={(value) => handleContactChange("name", value)}
                />
                <Field
                  label="Телефон"
                  error={isSubmitted && contactErrors.phone}
                  value={contact.phone}
                  onChange={(value) => handleContactChange("phone", value)}
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  maxLength={18}
                  onFocus={() => {
                    if (!contact.phone) {
                      handleContactChange("phone", "+7 (");
                    }
                  }}
                  onBlur={() => {
                    if (contact.phone === "+7 (" || contact.phone === "+7") {
                      handleContactChange("phone", "");
                    }
                  }}
                />
                <Field
                  label="Email"
                  error={isSubmitted && contactErrors.email}
                  type="email"
                  value={contact.email}
                  onChange={(value) => handleContactChange("email", value)}
                />
              </div>
            </CheckoutSection>

            <CheckoutSection icon={<Truck size={24} />} number={2} title="Доставка или самовывоз">
              <div className="grid gap-4 md:grid-cols-2">
                <ChoiceCard
                  checked={deliveryType === "delivery"}
                  disabled={!deliveryOptions.delivery.enabled}
                  title={deliveryOptions.delivery.title || "Доставка"}
                  text={deliveryOptions.delivery.description ?? "Привезем по указанному адресу"}
                  onClick={() => setDeliveryType("delivery")}
                />
                <ChoiceCard
                  checked={deliveryType === "pickup"}
                  disabled={!deliveryOptions.pickup.enabled}
                  title={deliveryOptions.pickup.title || "Самовывоз"}
                  text={deliveryOptions.pickup.description ?? "Заберите из ближайшего магазина"}
                  onClick={() => setDeliveryType("pickup")}
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={<MapPin size={24} />}
              number={3}
              title={deliveryType === "delivery" ? "Адрес доставки" : "Точка самовывоза"}
              error={isSubmitted && locationError}
            >
              {deliveryType === "delivery" ? (
                <>
                  <AddressSelector
                    addresses={addresses.items}
                    selectedAddressId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                  />
                  {isOutsideKizlyar ? (
                    <div className="mt-4 rounded-xl border border-rose-200/80 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                      <div className="mb-0.5 flex items-center gap-1.5 font-bold text-rose-900">
                        <AlertCircle size={15} className="shrink-0 text-rose-600" />
                        <span>Адрес за пределами зоны курьерской доставки</span>
                      </div>
                      <p className="leading-relaxed">
                        По этому адресу курьерская доставка недоступна. Можно оформить заказ
                        самовывозом из выбранного пункта выдачи.
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("pickup")}
                        className="mt-2.5 cursor-pointer rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                      >
                        Перейти на самовывоз
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                selectedPickupPoint ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
                    <p className="text-sm font-bold text-slate-900">{selectedPickupPoint.name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {selectedPickupPoint.city}, {selectedPickupPoint.address}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                      Пункт выдачи выбран в шапке сайта
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Выберите пункт выдачи в шапке сайта.
                  </p>
                )
              )}
            </CheckoutSection>

            <CheckoutSection
              icon={<Calendar size={24} />}
              number={4}
              title="Дата и время получения"
              error={isSubmitted && timeError}
            >
              <DateAndSlotPicker
                selectedDate={selectedDate}
                selectedSlotId={selectedSlotId}
                slots={slotsData.items}
                isLoading={isLoadingSlots}
                onDateChange={setSelectedDate}
                onSlotChange={setSelectedSlotId}
              />
            </CheckoutSection>

            <CheckoutSection icon={<CreditCard size={24} />} number={5} title="Способ оплаты">
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  checked={paymentMethod === "online"}
                  title="Онлайн"
                  text="Карта или СБП на странице оплаты"
                  onClick={() => setPaymentMethod("online")}
                />
                <ChoiceCard
                  checked={paymentMethod === "on_delivery"}
                  title="При получении"
                  text="Наличными или курьеру"
                  onClick={() => setPaymentMethod("on_delivery")}
                />
              </div>

            </CheckoutSection>

          </div>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <OrderSummary
              cart={cart}
              currentUser={currentUser}
              deliveryCalculation={deliveryCalculation}
              deliveryPrice={deliveryPrice}
              deliveryType={deliveryType}
              isPending={isPending}
              isRepricing={isRepricing}
              order={order}
              payment={payment}
              summary={summary}
              itemsCount={itemsCount}
              itemsTotal={itemsTotal}
              minOrderAmount={minOrderAmount}
              marketingConsent={marketingConsent}
              onMarketingConsentChange={setMarketingConsent}
            />
            <CheckoutBenefits
              itemsTotal={itemsTotal}
              freeFrom={Number(
                deliveryCalculation.free_delivery_from ||
                  deliveryOptions.delivery.free_from_amount ||
                  3000,
              )}
            />
          </aside>
        </form>
        <PhoneVerificationModal
          isOpen={isVerifyModalOpen}
          phone={contact.phone || currentUser?.phone || ""}
          onClose={() => setIsVerifyModalOpen(false)}
          onSuccess={() => {
            setIsVerifyModalOpen(false);
            setErrorMessage(null);
          }}
        />
      </Container>
    </main>
  );
};

interface CheckoutSectionProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  number: number;
  title: string;
  error?: boolean;
}

const CheckoutSection = ({ children, icon, number, title, error }: CheckoutSectionProps) => {
  return (
    <section
      id={"checkout-step-" + number}
      className={cn("bg-bg-primary scroll-mt-24 rounded-lg border p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)]", error ? "border-red-500 ring-1 ring-red-500" : "border-border")}
    >
      <h2 className="mb-5 flex items-center gap-3 text-xl font-bold">
        <span className="text-accent-primary">{icon}</span>
        {number}. {title}
      </h2>
      {children}
    </section>
  );
};

interface FieldProps {
  label: string;
  value: string;
  error?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange: (value: string) => void;
}

const Field = ({
  label,
  error,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  maxLength,
  type = "text",
  value,
}: FieldProps) => {
  return (
    <label className="block">
      <span className="text-text-secondary mb-2 block text-sm">{label}</span>
      <input
        className={cn("h-12 w-full rounded-lg border px-4 text-sm transition outline-none", error ? "border-red-500 bg-red-50 focus:border-red-500" : "border-border focus:border-accent-primary")}
        aria-invalid={error || undefined}
        required
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{value.trim() ? "Проверьте правильность заполнения" : "Обязательное поле"}</span>}
    </label>
  );
};

interface ChoiceCardProps {
  checked: boolean;
  title: string;
  text: string;
  disabled?: boolean;
  onClick: () => void;
}

const ChoiceCard = ({ checked, disabled = false, onClick, text, title }: ChoiceCardProps) => {
  return (
    <button
      className={cn(
        "grid min-h-18 grid-cols-[24px_minmax(0,1fr)] items-center gap-4 rounded-lg border p-4 text-left transition",
        checked
          ? "border-accent-primary bg-bg-hover"
          : "border-border bg-bg-primary hover:bg-bg-secondary",
        disabled && "cursor-not-allowed opacity-50",
      )}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full border",
          checked ? "border-accent-primary bg-accent-primary" : "border-text-muted",
        )}
      >
        {checked ? <Check className="text-accent-contrast" size={13} /> : null}
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="text-text-secondary mt-1 block text-sm">{text}</span>
      </span>
    </button>
  );
};

interface AddressSelectorProps {
  addresses: AddressResponse[];
  selectedAddressId: number | null;
  onSelect: (addressId: number) => void;
}

const AddressSelector = ({ addresses, onSelect, selectedAddressId }: AddressSelectorProps) => {
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);

  return (
    <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
      {addresses.length > 1 ? (
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold text-slate-600">
            Выберите адрес доставки
          </span>
          <select
            className="h-12 w-full min-w-0 rounded-lg border border-emerald-600 bg-emerald-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={selectedAddress?.id ?? ""}
            onChange={(event) => onSelect(Number(event.target.value))}
          >
            {!selectedAddress && <option value="" disabled>Выберите адрес</option>}
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.city}, {formatAddressTitle(address)}
              </option>
            ))}
          </select>
        </label>
      ) : addresses[0] ? (
        <div className="flex min-h-18 items-center gap-4 rounded-lg border border-emerald-600 bg-emerald-50 p-4">
          <Check size={20} className="shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="font-bold text-slate-800">{formatAddressTitle(addresses[0])}</p>
            <p className="mt-1 text-sm text-slate-500">{addresses[0].city}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Добавьте адрес доставки в разделе «Управление адресами».
        </p>
      )}
      <Link
        href={ROUTES.PROFILE_ADDRESSES}
        className="text-center text-xs font-semibold text-emerald-700 underline transition hover:text-emerald-800"
      >
        Управление адресами
      </Link>
    </div>
  );
};

interface DateAndSlotPickerProps {
  selectedDate: string;
  selectedSlotId: number | null;
  slots: DeliveryTimeSlotResponse[];
  isLoading?: boolean;
  onDateChange: (date: string) => void;
  onSlotChange: (slotId: number) => void;
}

const DateAndSlotPicker = ({
  onDateChange,
  onSlotChange,
  selectedDate,
  selectedSlotId,
  slots,
  isLoading = false,
}: DateAndSlotPickerProps) => {
  const todayStr = formatDateValue(new Date());
  const isToday = selectedDate === todayStr;
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDateValue(selectedDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const monthLabel = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const monthStartOffset = (visibleMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarDays: Array<number | null> = [
    ...Array.from({ length: monthStartOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = parseDateValue(todayStr);
  const isPreviousMonthDisabled =
    visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() <= today.getMonth();

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30;

  const processedSlots = slots.map((slot) => {
    let available = slot.available;
    if (isToday && slot.start_time) {
      const [h = 0, m = 0] = slot.start_time.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      if (slotMinutes < currentMinutes) {
        available = false;
      }
    }
    return { ...slot, available };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(230px,0.85fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold capitalize text-slate-800">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Предыдущий месяц"
                disabled={isPreviousMonthDisabled}
                onClick={() =>
                  setVisibleMonth(
                    (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Следующий месяц"
                onClick={() =>
                  setVisibleMonth(
                    (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((weekday) => (
              <span
                className="py-1 text-[10px] font-semibold text-slate-400"
                key={weekday}
              >
                {weekday}
              </span>
            ))}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <span aria-hidden="true" className="aspect-square" key={`empty-${index}`} />;
              }

              const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const dateValue = formatDateValue(date);
              const isSelected = dateValue === selectedDate;
              const isPast = dateValue < todayStr;

              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "aspect-square rounded-lg text-xs font-semibold transition",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isPast
                        ? "cursor-not-allowed text-slate-300"
                        : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
                  )}
                  disabled={isPast}
                  key={dateValue}
                  onClick={() => onDateChange(dateValue)}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 border-t border-slate-200 pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <p className="mb-3 text-xs font-bold text-slate-800">Доступное время</p>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((index) => (
                <div
                  className="h-10 animate-pulse rounded-lg bg-slate-200/70"
                  key={index}
                />
              ))}
            </div>
          ) : processedSlots.some((slot) => slot.available) ? (
            <div className="grid grid-cols-2 gap-2">
              {processedSlots
                .filter((slot) => slot.available)
                .map((slot) => {
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <button
                      className={cn(
                        "min-h-10 rounded-lg border px-2 text-[11px] font-bold transition",
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                      )}
                      key={slot.id}
                      onClick={() => onSlotChange(slot.id)}
                      type="button"
                    >
                      {slot.label}
                    </button>
                  );
                })}
            </div>
          ) : (
            <p className="rounded-lg bg-white p-3 text-[11px] leading-relaxed text-slate-500">
              На выбранную дату нет доступных интервалов. Выберите другой день.
            </p>
          )}

          {!isLoading && isToday && processedSlots.length > 0 && processedSlots.every((slot) => !slot.available) ? (
            <p className="mt-2 text-[10px] leading-relaxed text-amber-700">
              На сегодня свободных интервалов больше нет. Выберите другой день.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

interface OrderSummaryProps {
  isRepricing: boolean;
  cart: CartResponse;
  currentUser?: UserMeResponse | null | undefined;
  deliveryCalculation: DeliveryCalculateResponse;
  deliveryPrice: string;
  deliveryType: "delivery" | "pickup";
  isPending: boolean;
  order: OrderCreateResponse | null;
  payment: PaymentCreateResponse | null;
  summary: CartSummaryResponse;
  itemsCount: number;
  itemsTotal: number;
  minOrderAmount: number;
  marketingConsent: boolean;
  onMarketingConsentChange: (value: boolean) => void;
}

const OrderSummary = ({
  cart,
  currentUser,
  deliveryCalculation,
  deliveryPrice,
  deliveryType,
  isPending,
  isRepricing,
  order,
  payment,
  summary,
  itemsCount,
  itemsTotal,
  minOrderAmount,
  marketingConsent,
  onMarketingConsentChange,
}: OrderSummaryProps) => {
  const { isMaintenance } = useDynamicStoreInfo();
  const finalWithDelivery = Number(summary.final_price) + Number(deliveryPrice);
  const freeFrom = Number(deliveryCalculation.free_delivery_from || 3000);
  const amountLeft = Math.max(0, freeFrom - itemsTotal);
  const isMinOrderMet =
    itemsCount > 0 && (deliveryType === "pickup" || itemsTotal >= minOrderAmount);

  return (
    <section
      className="border-border bg-bg-primary rounded-2xl border p-5 shadow-[0_14px_40px_rgb(20_28_18/0.08)]"
      id="checkout-step-6"
    >
      <h2 className="mb-5 text-xl font-bold text-slate-900">Ваш заказ</h2>

      {itemsCount === 0 ? (
        <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-800">
          <p className="text-sm font-bold">
            {cart.items.length ? "Нет доступных товаров" : "Корзина пуста"}
          </p>
          <p className="font-normal text-slate-600">
            {cart.items.length
              ? "Товары закончились в выбранном магазине и не включены в сумму оплаты."
              : "Добавьте товары из каталога для оформления заказа."}
          </p>
          <Link
            href={ROUTES.CATALOG}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="max-h-[280px] space-y-4 overflow-y-auto pr-1">
          {cart.items.map((item) => {
            const { lineDiscount, originalTotal } = getCartItemPriceBreakdown(item);

            return (
              <div
                className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[56px_minmax(0,1fr)_90px]"
                key={item.id}
              >
                <ProductThumb item={item} size={56} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold sm:text-sm">{item.name}</p>
                  <p className="text-text-secondary text-xs">
                    {formatQuantity(item.quantity)} {item.unit}
                  </p>
                  <p className="text-text-secondary text-[11px]">
                    {toPriceFormat(item.price)} x {formatQuantity(item.quantity)}
                  </p>
                </div>
                <div className="col-start-2 flex flex-col items-end text-right sm:col-start-auto">
                  {item.is_available ? (
                    <>
                      {lineDiscount > 0 ? (
                        <>
                          <span className="text-[10px] text-slate-400 line-through">
                            {toPriceFormat(originalTotal)}
                          </span>
                          <span className="text-xs font-bold sm:text-sm">
                            {toPriceFormat(item.final_price)}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-600">
                            −{toPriceFormat(lineDiscount)} скидка
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold sm:text-sm">
                          {toPriceFormat(item.final_price)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-medium text-slate-500">
                      Нет в наличии · не в сумме
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-border mt-5 space-y-3 border-y py-4 text-xs sm:text-sm">
        <SummaryLine
          label={`Товары (${itemsCount})`}
          value={toPriceFormat(summary.subtotal || summary.final_price || "0")}
        />
        {Number(summary.discount_amount) > 0 ? (
          <SummaryLine
            label="Скидка на товары"
            value={`-${toPriceFormat(summary.discount_amount)}`}
            danger
          />
        ) : null}
        {summary.promo_code ? (
          <SummaryLine
            label={`Промокод (${summary.promo_code})`}
            value={`-${toPriceFormat(summary.promo_discount_amount)}`}
            danger
          />
        ) : null}
        <SummaryLine
          label="Доставка"
          value={deliveryPrice === "0" ? "Бесплатно" : toPriceFormat(deliveryPrice)}
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-xl font-bold">Итого</span>
        <span className="text-3xl font-black text-slate-900">
          {toPriceFormat(finalWithDelivery)}
        </span>
      </div>

      {deliveryType === "delivery" && itemsTotal < minOrderAmount ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs font-medium text-amber-950">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-900">
            <AlertCircle size={15} className="shrink-0 text-amber-600" />
            <span>Минимальная сумма для доставки — {toPriceFormat(minOrderAmount)}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            В корзине на <strong className="font-bold">{toPriceFormat(itemsTotal)}</strong>. Не
            хватает{" "}
            <strong className="font-bold text-emerald-800">
              {toPriceFormat(minOrderAmount - itemsTotal)}
            </strong>
            .
          </p>
          <Link
            href={ROUTES.CATALOG}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Добавить товары из каталога →
          </Link>
        </div>
      ) : null}

      <Button
        className="mt-5 h-14 w-full cursor-pointer text-base font-bold shadow-md shadow-emerald-700/20"
        type="submit"
        disabled={
          isRepricing ||
          isPending ||
          isMaintenance ||
          itemsCount === 0 ||
          !isMinOrderMet ||
          Boolean(order)
        }
      >
        {isRepricing ? (
          "Пересчитываем корзину…"
        ) : isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            <span>Создание заказа...</span>
          </span>
        ) : order ? (
          "Заказ создан"
        ) : itemsCount === 0 ? (
          "Корзина пуста"
        ) : !isMinOrderMet ? (
          `Минимум ${toPriceFormat(minOrderAmount)}`
        ) : (
          "Создать заказ"
        )}
      </Button>

      {order ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
          <p className="font-bold">Заказ № {order.order_number} успешно оформлен!</p>
          {payment?.payment_url ? (
            <a
              className="mt-1.5 block font-bold text-emerald-700 underline hover:text-emerald-800"
              href={payment.payment_url}
            >
              Перейти к оплате онлайн →
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Прогресс-бар бесплатной доставки */}
      {freeFrom > 0 && deliveryType === "delivery" ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
          <div className="mb-1.5 flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-semibold">
              {amountLeft === 0 ? "Бесплатная доставка активна! 🎉" : "До бесплатной доставки:"}
            </span>
            <span className="text-[11px] font-black text-emerald-800">
              {amountLeft === 0 ? "0 ₽" : toPriceFormat(amountLeft)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-emerald-200/50">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(5, (itemsTotal / freeFrom) * 100))}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Юридический комплаенс 152-ФЗ без единого принудительного чекбокса */}
      <p className="mt-3.5 text-center text-[11px] leading-relaxed text-slate-500">
        Нажимая «Создать заказ», вы соглашаетесь с условиями{" "}
        <Link
          className="font-semibold text-emerald-700 hover:underline"
          href={ROUTES.OFFER}
          target="_blank"
        >
          Публичной оферты
        </Link>{" "}
        и даете{" "}
        <Link
          className="font-semibold text-emerald-700 hover:underline"
          href={ROUTES.PERSONAL_DATA_CONSENT}
          target="_blank"
        >
          Согласие на обработку персональных данных
        </Link>{" "}
        в соответствии с{" "}
        <Link
          className="font-semibold text-emerald-700 hover:underline"
          href={ROUTES.PRIVACY}
          target="_blank"
        >
          Политикой конфиденциальности
        </Link>
        .
      </p>

      {/* Опциональное согласие на маркетинговые рассылки (38-ФЗ) */}
      {currentUser?.marketing_consent === false ? (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[11px] text-slate-600 select-none">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => onMarketingConsentChange(e.target.checked)}
            className="mt-0.5 size-4 rounded accent-emerald-600"
          />
          <span>Получать персональные скидки, промокоды и уведомления об акциях (38-ФЗ)</span>
        </label>
      ) : null}
    </section>
  );
};

interface SummaryLineProps {
  label: string;
  value: string;
  danger?: boolean;
}

const SummaryLine = ({ danger = false, label, value }: SummaryLineProps) => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("font-semibold", danger && "text-error")}>{value}</span>
    </div>
  );
};

interface CheckoutBenefitsProps {
  itemsTotal: number;
  freeFrom: number;
}

const CheckoutBenefits = ({ itemsTotal, freeFrom }: CheckoutBenefitsProps) => {
  const amountLeft = Math.max(0, freeFrom - itemsTotal);
  const isFree = itemsTotal >= freeFrom && itemsTotal > 0;

  return (
    <section className="border-border bg-bg-primary divide-border overflow-hidden rounded-2xl border shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <div className="flex items-start gap-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 p-5">
        <span className="shrink-0 text-emerald-600">
          <Truck size={24} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {isFree ? "Бесплатная доставка активна! 🎉" : "До бесплатной доставки"}
          </p>
          {isFree ? (
            <p className="mt-1 text-xs text-slate-600">Ваш заказ доставляется курьером за 0 ₽</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Не хватает {toPriceFormat(amountLeft)} ·{" "}
              <Link href={ROUTES.CATALOG} className="font-bold text-emerald-700 hover:underline">
                Вернуться в каталог
              </Link>
            </p>
          )}
        </div>
      </div>
      <Benefit
        icon={<ShieldCheck size={24} />}
        title="Безопасная оплата"
        text="СБП, банковская карта или оплата при получении"
      />
      <Benefit
        icon={<PackageCheck size={24} />}
        title="Гарантия свежести"
        text="Контроль качества и срока годности до 48 часов"
      />
      <Benefit
        icon={<LockKeyhole size={24} />}
        title="Защита данных (152-ФЗ)"
        text="Ваши персональные данные защищены законом"
      />
    </section>
  );
};

interface BenefitProps {
  icon: React.ReactNode;
  text: string;
  title: string;
}

const Benefit = ({ icon, text, title }: BenefitProps) => {
  return (
    <div className="flex items-start gap-4 p-5">
      <span className="text-accent-primary shrink-0">{icon}</span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-text-secondary mt-1 text-sm">{text}</p>
      </div>
    </div>
  );
};

interface ProductThumbProps {
  item: CartItemResponse;
  size?: number;
}

const ProductThumb = ({ item, size = 56 }: ProductThumbProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 shadow-2xs"
      style={{
        height: `${size}px`,
        width: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
      }}
    >
      {item.preview_image_url && !hasError ? (
        <Image
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
          height={size}
          unoptimized
          src={item.preview_image_url}
          width={size}
          onError={() => setHasError(true)}
        />
      ) : (
        <ShoppingBag className="text-emerald-600/70" size={Math.round(size / 2.3)} />
      )}
    </div>
  );
};

const formatAddressTitle = (address: AddressResponse): string => {
  const apartment = address.apartment ? `, кв. ${address.apartment}` : "";

  return `ул. ${address.street}, д. ${address.house}${apartment}`;
};

const formatQuantity = (value: number | string): string => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(1);
};

const getCartItemPriceBreakdown = (item: CartItemResponse) => {
  const quantity = Number(item.quantity) || 0;
  const oldUnitPrice = Number(item.old_price ?? item.price) || 0;
  const originalTotal = Math.max(Number(item.total_price) || 0, oldUnitPrice * quantity);
  const finalTotal = Number(item.final_price) || 0;

  return {
    originalTotal,
    lineDiscount: Math.max(0, originalTotal - finalTotal),
  };
};

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};
