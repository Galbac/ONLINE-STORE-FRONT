"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Calendar,
  Check,
  ClipboardCheck,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  X,
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
import { apiClient, extractErrorMessage } from "@/shared/api";
import { cn, ROUTES, STORE_INFO } from "@/shared/config";
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
type PaymentMethod = "online" | "on_delivery" | "sbp";

const steps = [
  "Контакты",
  "Получение",
  "Адрес / ПВЗ",
  "Дата и время",
  "Оплата",
  "Проверка",
] as const;

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
  const { selectedStore, setSelectedStore } = useStoreBranch();
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
  const [usePoints, setUsePoints] = useState<number>(0);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);

  useEffect(() => {
    apiClient
      .get<{ balance: number }>("/api/profile/loyalty")
      .then((res) => {
        if (typeof res?.balance === "number") {
          setLoyaltyBalance(res.balance);
        }
      })
      .catch(() => {});
  }, []);
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [intercom, setIntercom] = useState("");
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [dontRingDoorbell, setDontRingDoorbell] = useState(false);
  const [substitutionPolicy, setSubstitutionPolicy] = useState<"call" | "replace" | "remove">(
    "call",
  );
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
  const [timeMode, setTimeMode] = useState<"slot" | "asap" | "custom">("slot");
  const [customTime, setCustomTime] = useState<string>("");
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

  const isStep1Done = Boolean(
    contact.name.trim().length >= 2 && normalizePhoneNumber(contact.phone).length >= 11,
  );
  const isStep2Done = Boolean(deliveryType === "delivery" || deliveryType === "pickup");
  const isStep3Done =
    deliveryType === "pickup" ? Boolean(selectedPickupPointId) : Boolean(selectedAddressId);
  const isStep4Done = Boolean(
    selectedDate &&
    (timeMode === "asap" ||
      (timeMode === "custom" && customTime.trim().length >= 2) ||
      (timeMode === "slot" && selectedSlotId && selectedSlot?.available)),
  );
  const isStep5Done = Boolean(paymentMethod);
  const isStep6Done = Boolean(order);

  const completedSteps = useMemo(
    () => ({
      1: isStep1Done,
      2: isStep2Done,
      3: isStep3Done,
      4: isStep4Done,
      5: isStep5Done,
      6: isStep6Done,
    }),
    [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done, isStep6Done],
  );

  const currentStep = useMemo(() => {
    if (order) return 6;
    if (!isStep1Done) return 1;
    if (!isStep2Done) return 2;
    if (!isStep3Done) return 3;
    if (!isStep4Done) return 4;
    if (!isStep5Done) return 5;
    return 6;
  }, [order, isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done]);

  const handleScrollToStep = (stepNumber: number) => {
    const elem = document.getElementById("checkout-step-" + stepNumber);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    if (isRepricing) {
      setErrorMessage("Дождитесь пересчёта корзины для выбранного магазина");
      return;
    }
    setErrorMessage(null);

    if (marketingConsent && !currentUser?.marketing_consent) {
      userApi.updateMarketingConsent(true).catch(() => {});
    }

    let timeComment = "";
    if (timeMode === "asap") {
      timeComment = "[Время: Как можно скорее (60-90 мин)]";
    } else if (timeMode === "custom" && customTime.trim()) {
      timeComment = `[Время: ${customTime.trim()}]`;
    }

    const resolvedSlotId =
      timeMode === "slot"
        ? selectedSlot?.available
          ? selectedSlot.id
          : firstAvailableSlot?.available
            ? firstAvailableSlot.id
            : null
        : null;

    if (timeMode === "slot" && !resolvedSlotId) {
      setErrorMessage(
        "Выбранный интервал времени недоступен. Пожалуйста, выберите свободный интервал или переключитесь на режим «Как можно скорее» / «Своё время».",
      );
      return;
    }

    const notesParts = [
      timeComment,
      leaveAtDoor ? "Оставить заказ у двери" : "",
      dontRingDoorbell ? "Не звонить в звонок" : "",
    ].filter(Boolean);
    const fullComment = notesParts.join(". ");

    const request: OrderCreateRequest = {
      expected_cart_total: String(summary.final_price),
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      customer_name: contact.name,
      customer_phone: normalizePhoneNumber(contact.phone),
      customer_email: contact.email || null,
      delivery_date: selectedDate,
      delivery_time_slot_id: resolvedSlotId,
      comment: fullComment || null,
      use_points: usePoints > 0 ? usePoints : 0,
      leave_at_door: leaveAtDoor,
      dont_ring_doorbell: dontRingDoorbell,
      substitution_policy: substitutionPolicy,
      apartment: apartment.trim() || null,
      entrance: entrance.trim() || null,
      floor: floor.trim() || null,
      intercom: intercom.trim() || null,
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
        if (paymentMethod === "online" || paymentMethod === "sbp") {
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

        <CheckoutSteps
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleScrollToStep}
        />

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-5 grid gap-5 sm:mt-8 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_390px]"
          onSubmit={handleCreateOrder}
        >
          <div className="min-w-0 space-y-4">
            <CheckoutSection icon={<UserRound size={24} />} number={1} title="Контактные данные">
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Имя"
                  value={contact.name}
                  onChange={(value) => handleContactChange("name", value)}
                />
                <Field
                  label="Телефон"
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
            >
              {deliveryType === "delivery" ? (
                <>
                  <AddressSelector
                    addresses={addresses.items}
                    selectedAddressId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                  />
                  <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <h4 className="text-xs font-bold text-slate-800">
                      Пожелания к доставке и сборке
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Кв. / Офис
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                          placeholder="12"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Подъезд
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                          placeholder="1"
                          value={entrance}
                          onChange={(e) => setEntrance(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Этаж
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                          placeholder="3"
                          value={floor}
                          onChange={(e) => setFloor(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Домофон
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                          placeholder="12К"
                          value={intercom}
                          onChange={(e) => setIntercom(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 pb-1">
                      <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-700 select-none">
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
                          checked={leaveAtDoor}
                          onChange={(e) => setLeaveAtDoor(e.target.checked)}
                        />
                        <span>Оставить заказ у двери</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-700 select-none">
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
                          checked={dontRingDoorbell}
                          onChange={(e) => setDontRingDoorbell(e.target.checked)}
                        />
                        <span>Не звонить в звонок (спит ребёнок)</span>
                      </label>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <label className="mb-3 block text-xs font-bold text-slate-800">
                        Если товара не окажется на складе:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "call", label: "Позвонить и согласовать" },
                          { value: "replace", label: "Заменить на свежий" },
                          { value: "remove", label: "Убрать из заказа" },
                        ].map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setSubstitutionPolicy(p.value as any)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                              substitutionPolicy === p.value
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Зона и стоимость доставки по Кизляру (Интегрировано в шаг 3) */}
                  <div className="mt-4 space-y-2 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                          <Truck size={16} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Зона доставки:{" "}
                            {isOutsideKizlyar
                              ? "Вне зоны курьерской доставки"
                              : activeCalculation.zone?.name || "Кизляр — Центральный"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {isOutsideKizlyar
                              ? "Курьерская доставка действует по г. Кизляр и пригородным поселкам"
                              : `Тариф доставки: ${deliveryPrice === "0" ? "Бесплатно" : `${deliveryPrice} ₽`} (бесплатно от ${toPriceFormat(activeCalculation.free_delivery_from || 3000)})`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-black",
                            isOutsideKizlyar
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100/80 text-emerald-800",
                          )}
                        >
                          {isOutsideKizlyar
                            ? "Курьер недоступен"
                            : deliveryPrice === "0"
                              ? "0 ₽ (Бесплатно)"
                              : `${deliveryPrice} ₽`}
                        </span>
                      </div>
                    </div>

                    {isOutsideKizlyar ? (
                      <div className="mt-2 rounded-xl border border-rose-200/80 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                        <div className="mb-0.5 flex items-center gap-1.5 font-bold text-rose-900">
                          <AlertCircle size={15} className="shrink-0 text-rose-600" />
                          <span>Адрес за пределами зоны курьерской доставки</span>
                        </div>
                        <p className="leading-relaxed">
                          По данному адресу курьерская доставка не осуществляется. Вы можете забрать
                          заказ самовывозом из супермаркета в г. Кизляр.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryType("pickup");
                            if (!selectedPickupPointId && pickupPoints.items.length > 0) {
                              if (pickupPoints.items[0]?.id)
                                setSelectedPickupPointId(pickupPoints.items[0].id);
                            }
                          }}
                          className="mt-2.5 cursor-pointer rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                        >
                          Перейти на самовывоз (Бесплатно)
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <PickupSelector
                  pickupPoints={pickupPoints.items}
                  selectedPickupPointId={selectedPickupPointId}
                  onSelect={(pointId) => {
                    const point = pickupPoints.items.find((item) => item.id === pointId);
                    setSelectedPickupPointId(pointId);
                    if (point && point.id !== selectedStore?.id) setSelectedStore(point);
                  }}
                />
              )}
            </CheckoutSection>

            <CheckoutSection
              icon={<Calendar size={24} />}
              number={4}
              title="Дата и время получения"
            >
              <DateAndSlotPicker
                selectedDate={selectedDate}
                selectedSlotId={selectedSlotId}
                slots={slotsData.items}
                isLoading={isLoadingSlots}
                deliveryType={deliveryType}
                onDateChange={setSelectedDate}
                onSlotChange={setSelectedSlotId}
                timeMode={timeMode}
                onTimeModeChange={setTimeMode}
                customTime={customTime}
                onCustomTimeChange={setCustomTime}
              />
            </CheckoutSection>

            <CheckoutSection icon={<CreditCard size={24} />} number={5} title="Способ оплаты">
              <div className="grid gap-3 sm:grid-cols-3">
                <ChoiceCard
                  checked={paymentMethod === "sbp"}
                  title="СБП (в 1 клик)"
                  text="Приложение банка, 0% комиссии"
                  onClick={() => setPaymentMethod("sbp")}
                />
                <ChoiceCard
                  checked={paymentMethod === "online"}
                  title="Банковская карта"
                  text="Любая карта онлайн"
                  onClick={() => setPaymentMethod("online")}
                />
                <ChoiceCard
                  checked={paymentMethod === "on_delivery"}
                  title="При получении"
                  text="Наличными или курьеру"
                  onClick={() => setPaymentMethod("on_delivery")}
                />
              </div>

              {/* Блок списания бонусов внутри шага оплаты */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Бонусные баллы</h4>
                    <p className="text-xs text-slate-500">
                      Доступно: {loyaltyBalance} бонусов. Оплата бонусами до 50% стоимости товаров.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={Math.min(loyaltyBalance, Math.floor(itemsTotal * 0.5))}
                    className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    placeholder="0 бонусов"
                    value={usePoints || ""}
                    onChange={(e) => {
                      const maxPoints = Math.min(loyaltyBalance, Math.floor(itemsTotal * 0.5));
                      const val = Math.max(0, Math.min(Number(e.target.value) || 0, maxPoints));
                      setUsePoints(val);
                    }}
                  />
                  <span className="text-xs font-bold text-slate-600">₽</span>
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={<ClipboardCheck size={24} />}
              number={6}
              title="Проверьте ваш заказ"
            >
              <ReviewList items={cart.items} />
              {order ? (
                <div className="bg-bg-hover mt-4 rounded-lg p-4 text-sm">
                  <p className="font-bold">Заказ создан: {order.order_number}</p>
                  {payment ? (
                    <p className="text-text-secondary mt-1">
                      Платеж создан: #{payment.id}, статус {payment.status}
                    </p>
                  ) : null}
                </div>
              ) : null}
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

interface CheckoutStepsProps {
  currentStep: number;
  completedSteps: Record<number, boolean>;
  onStepClick?: (stepNumber: number) => void;
}

const CheckoutSteps = ({ currentStep, completedSteps, onStepClick }: CheckoutStepsProps) => {
  return (
    <div className="relative mb-2">
      <div className="[scrollbar-width:none] overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <ol className="flex min-w-[580px] gap-3 pr-8 md:grid md:min-w-0 md:grid-cols-6 md:pr-0">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isStepDone = Boolean(completedSteps[stepNumber]);
            const allPreviousDone = Boolean(
              completedSteps[1] &&
              completedSteps[2] &&
              completedSteps[3] &&
              completedSteps[4] &&
              completedSteps[5],
            );

            // Для шагов 1-5: если данные заполнены — показываем галочку
            // Для шага 6 (Проверка): галочка только если заказ уже отправлен, иначе активен если все 1-5 заполнены
            const isCompleted = stepNumber === 6 ? isStepDone : isStepDone;
            const isCurrent =
              stepNumber === 6
                ? !isStepDone && allPreviousDone
                : !isStepDone && stepNumber === currentStep;
            const isUpcoming = !isCompleted && !isCurrent;

            return (
              <li
                className="group relative flex flex-1 shrink-0 cursor-pointer items-center gap-2.5 md:block md:text-center"
                key={step}
                onClick={() => onStepClick?.(stepNumber)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onStepClick?.(stepNumber);
                  }
                }}
              >
                <span
                  className={cn(
                    "relative z-10 mx-auto grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all duration-200 md:size-9 md:text-sm",
                    isCompleted && "border-emerald-600 bg-emerald-600 text-white shadow-xs",
                    isCurrent &&
                      "border-2 border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm ring-4 ring-emerald-100",
                    isUpcoming &&
                      "border-slate-200 bg-slate-100 text-slate-400 group-hover:border-slate-300",
                  )}
                >
                  {isCompleted ? <Check className="size-4 stroke-[2.5] md:size-4.5" /> : stepNumber}
                </span>
                {stepNumber < steps.length ? (
                  <span
                    className={cn(
                      "absolute top-4 left-1/2 hidden h-0.5 w-full transition-colors duration-200 md:block",
                      isCompleted ? "bg-emerald-500" : "bg-slate-200",
                    )}
                  />
                ) : null}
                <p
                  className={cn(
                    "max-w-[85px] truncate text-xs leading-tight transition-colors md:mt-2 md:max-w-none md:text-sm",
                    isCompleted && "font-medium text-slate-700 group-hover:text-emerald-700",
                    isCurrent && "font-bold text-emerald-700",
                    isUpcoming && "font-normal text-slate-400 group-hover:text-slate-600",
                  )}
                >
                  {step}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent md:hidden"
      />
    </div>
  );
};

interface CheckoutSectionProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  number: number;
  title: string;
}

const CheckoutSection = ({ children, icon, number, title }: CheckoutSectionProps) => {
  return (
    <section
      id={"checkout-step-" + number}
      className="border-border bg-bg-primary scroll-mt-24 rounded-lg border p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)]"
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
  type?: string;
  placeholder?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange: (value: string) => void;
}

const Field = ({
  label,
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
        className="border-border focus:border-accent-primary h-12 w-full rounded-lg border px-4 text-sm transition outline-none"
        required={label !== "Email"}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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

interface AddressSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAddress: (addressText: string) => void;
}

const COMMON_ADDRESS_SUGGESTIONS = [
  `ул. Победы, д. 15, ${STORE_INFO.city}`,
  `ул. Победы, д. 87А, ${STORE_INFO.city}`,
  `ул. Ленина, д. 24, ${STORE_INFO.city}`,
  `ул. Советская, д. 10, ${STORE_INFO.city}`,
  `ул. Гагарина, д. 42, ${STORE_INFO.city}`,
  `ул. Мира, д. 5, ${STORE_INFO.city}`,
  `ул. Пушкина, д. 18, ${STORE_INFO.city}`,
];

const AddressAutocompleteModal = ({
  isOpen,
  onClose,
  onAddAddress,
}: AddressSuggestionModalProps) => {
  const [query, setQuery] = useState("");
  const [apt, setApt] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? COMMON_ADDRESS_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase().trim()))
    : COMMON_ADDRESS_SUGGESTIONS.slice(0, 5);

  const handleSelect = (s: string) => {
    setQuery(s);
    setIsFocused(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddr = apt.trim() ? `${query.trim()}, кв. ${apt.trim()}` : query.trim();
    if (finalAddr) {
      onAddAddress(finalAddr);
      onClose();
    }
  };

  return (
    <div className="animate-in fade-in-0 fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs duration-150">
      <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl duration-150">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <MapPin size={18} className="text-emerald-600" />
            Быстрое добавление адреса
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Улица и номер дома (начните вводить):
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Например: ул. Ленина, д. 15"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />

            {isFocused && filtered.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-1">
                  {filtered.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => handleSelect(s)}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Квартира / Офис (необязательно):
            </label>
            <input
              type="text"
              placeholder="Например: 42"
              value={apt}
              onChange={(e) => setApt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="h-10 text-xs">
              Отмена
            </Button>
            <Button type="submit" disabled={!query.trim()} className="h-10 text-xs font-bold">
              Сохранить адрес
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddressSelectorProps {
  addresses: AddressResponse[];
  selectedAddressId: number | null;
  onSelect: (addressId: number) => void;
}

const AddressSelector = ({ addresses, onSelect, selectedAddressId }: AddressSelectorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customAddresses, setCustomAddresses] = useState<
    Array<{ id: number; title: string; city: string }>
  >([]);

  const handleAddCustom = (fullAddress: string) => {
    const newId = Date.now();
    setCustomAddresses((prev) => [
      ...prev,
      { id: newId, title: fullAddress, city: STORE_INFO.city },
    ]);
    onSelect(newId);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
      <div className="grid gap-3">
        {addresses.map((address) => (
          <ChoiceCard
            key={address.id}
            checked={selectedAddressId === address.id}
            title={formatAddressTitle(address)}
            text={`${address.city}, Россия`}
            onClick={() => onSelect(address.id)}
          />
        ))}
        {customAddresses.map((custom) => (
          <ChoiceCard
            key={custom.id}
            checked={selectedAddressId === custom.id}
            title={custom.title}
            text={`${custom.city}, Россия`}
            onClick={() => onSelect(custom.id)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          className="w-full self-start text-xs font-bold"
          variant="secondary"
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          + Быстрый адрес
        </Button>
        <Link
          href={ROUTES.PROFILE_ADDRESSES}
          className="text-center text-[11px] text-slate-400 hover:text-emerald-700"
        >
          Управление адресами
        </Link>
      </div>

      <AddressAutocompleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddAddress={handleAddCustom}
      />
    </div>
  );
};

interface PickupSelectorProps {
  pickupPoints: PickupPointListResponse["items"];
  selectedPickupPointId: number | null;
  onSelect: (pointId: number) => void;
}

const PickupSelector = ({ onSelect, pickupPoints, selectedPickupPointId }: PickupSelectorProps) => {
  return (
    <div className="grid gap-3">
      {pickupPoints.map((point) => (
        <ChoiceCard
          key={point.id}
          checked={selectedPickupPointId === point.id}
          title={point.name}
          text={`${point.city}, ${point.address}`}
          onClick={() => onSelect(point.id)}
        />
      ))}
    </div>
  );
};

interface DateAndSlotPickerProps {
  selectedDate: string;
  selectedSlotId: number | null;
  slots: DeliveryTimeSlotResponse[];
  isLoading?: boolean;
  deliveryType: DeliveryType;
  onDateChange: (date: string) => void;
  onSlotChange: (slotId: number) => void;
  timeMode: "slot" | "asap" | "custom";
  onTimeModeChange: (mode: "slot" | "asap" | "custom") => void;
  customTime: string;
  onCustomTimeChange: (time: string) => void;
}

const DateAndSlotPicker = ({
  onDateChange,
  onSlotChange,
  selectedDate,
  selectedSlotId,
  slots,
  isLoading = false,
  deliveryType,
  timeMode,
  onTimeModeChange,
  customTime,
  onCustomTimeChange,
}: DateAndSlotPickerProps) => {
  const dateOptions = getDateOptions();
  const todayStr = formatDateValue(new Date());
  const isToday = selectedDate === todayStr;

  // Filter out past slots for Today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30; // +30 мин на сборку заказа

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

  const quickCustomTimes = ["к 18:30", "к 19:00", "к 19:30", "к 20:00", "после 20:00", "к 21:00"];

  return (
    <div className="space-y-5">
      {/* 1. Выбор дня */}
      <div>
        <label className="mb-2 block text-xs font-bold text-slate-700">
          1. Дата получения заказа:
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          {dateOptions.map((option) => {
            const isSelected = selectedDate === option.value;
            return (
              <button
                className={cn(
                  "flex h-13 min-w-28 cursor-pointer flex-col items-center justify-center rounded-xl border px-4 transition-all active:scale-98",
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-800 shadow-xs ring-2 ring-emerald-600/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                type="button"
                key={option.value}
                onClick={() => onDateChange(option.value)}
              >
                <span className="text-xs font-bold">{option.label}</span>
                <span className="text-[11px] text-slate-400">{option.subLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Формат времени доставки */}
      <div>
        <label className="mb-2 block text-xs font-bold text-slate-700">
          2. Предпочтение по времени доставки:
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Режим: Как можно скорее */}
          <button
            type="button"
            onClick={() => onTimeModeChange("asap")}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-all active:scale-98",
              timeMode === "asap"
                ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-900 shadow-2xs ring-2 ring-emerald-600/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">
              ⚡
            </span>
            <div>
              <p className="text-xs font-bold">Как можно скорее</p>
              <p className="text-[11px] text-slate-500">Обычно 60–90 мин</p>
            </div>
          </button>

          {/* Режим: Интервал времени */}
          <button
            type="button"
            onClick={() => onTimeModeChange("slot")}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-all active:scale-98",
              timeMode === "slot"
                ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-900 shadow-2xs ring-2 ring-emerald-600/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-700">
              🕒
            </span>
            <div>
              <p className="text-xs font-bold">Интервал слотов</p>
              <p className="text-[11px] text-slate-500">Выбрать из графика</p>
            </div>
          </button>

          {/* Режим: Своё время */}
          <button
            type="button"
            onClick={() => onTimeModeChange("custom")}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-all active:scale-98",
              timeMode === "custom"
                ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-900 shadow-2xs ring-2 ring-emerald-600/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-700">
              ✏️
            </span>
            <div>
              <p className="text-xs font-bold">Своё точное время</p>
              <p className="text-[11px] text-slate-500">Указать точный час</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Детали выбранного режима */}
      {timeMode === "slot" && (
        <div className="pt-1">
          <label className="mb-2 block text-xs font-bold text-slate-700">
            Выберите доступный интервал:
          </label>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-xl border border-slate-200/60 bg-slate-100"
                />
              ))}
            </div>
          ) : processedSlots.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs font-medium text-slate-600">
              {deliveryType === "pickup"
                ? "Для выбранного пункта самовывоза нет фиксированных интервалов. Вы можете выбрать режим «Как можно скорее» или указать удобное время."
                : "На выбранную дату нет доступных интервалов доставки. Пожалуйста, выберите другую дату или режим «Как можно скорее»."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {processedSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl border px-3 text-xs font-bold transition-all active:scale-98",
                      isSelected && slot.available
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : slot.available
                          ? "cursor-pointer border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through opacity-60",
                    )}
                    type="button"
                    disabled={!slot.available}
                    key={slot.id}
                    onClick={() => onSlotChange(slot.id)}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
          {!isLoading &&
          isToday &&
          processedSlots.length > 0 &&
          processedSlots.every((s) => !s.available) ? (
            <p className="mt-2.5 rounded-xl border border-amber-200/70 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              🕒 Все стандартные интервалы на сегодня завершены. Выберите режим{" "}
              <strong>«Как можно скорее»</strong>, укажите <strong>«Своё точное время»</strong> или
              получение на завтра.
            </p>
          ) : null}
        </div>
      )}

      {timeMode === "custom" && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="block text-xs font-bold text-slate-800">
            {deliveryType === "pickup"
              ? "В какое время вам удобно забрать заказ из пункта выдачи?"
              : "В какое время вам удобно встретить курьера?"}
          </label>
          <input
            type="text"
            value={customTime}
            onChange={(e) => onCustomTimeChange(e.target.value)}
            placeholder="Например: к 19:30, после 20:00 или с 18:00 до 19:00"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
          <div>
            <span className="mr-2 text-[11px] font-semibold text-slate-500">Быстрый выбор:</span>
            <div className="mt-1.5 inline-flex flex-wrap gap-1.5">
              {quickCustomTimes.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => onCustomTimeChange(t)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                    customTime === t
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {timeMode === "asap" && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
          <span className="text-base">🚀</span>
          <p className="leading-relaxed">
            Курьер доставит заказ <strong>в течение 60–90 минут</strong> после сборки. Наш оператор
            сразу передаст заказ на сборку в супермаркет.
          </p>
        </div>
      )}
    </div>
  );
};

interface ReviewListProps {
  items: CartItemResponse[];
}

const ReviewList = ({ items }: ReviewListProps) => (
  <div className="divide-y divide-slate-100">
    {items.map((item) => (
      <div
        key={item.id}
        className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] items-start gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[56px_minmax(0,1fr)_auto]"
      >
        <ProductThumb item={item} size={48} />
        <div className="min-w-0">
          <p className="text-sm leading-snug font-bold break-words">{item.name}</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              {formatQuantity(item.quantity)} {item.unit} × {toPriceFormat(item.price)}
            </span>
            <span className="font-bold text-slate-900 sm:hidden">
              {item.is_available ? toPriceFormat(item.final_price) : "Нет в наличии"}
            </span>
          </div>
          {!item.is_available && (
            <p className="mt-1 text-xs text-rose-600">Не включён в заказ и сумму оплаты</p>
          )}
        </div>
        <span className="hidden text-right text-sm font-bold sm:block">
          {item.is_available ? toPriceFormat(item.final_price) : "Нет в наличии"}
        </span>
      </div>
    ))}
  </div>
);

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
    <section className="border-border bg-bg-primary rounded-2xl border p-5 shadow-[0_14px_40px_rgb(20_28_18/0.08)]">
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
          {cart.items.map((item) => (
            <div
              className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[56px_minmax(0,1fr)_75px]"
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
              <span className="col-start-2 text-right text-xs font-bold sm:col-start-auto sm:text-sm">
                {item.is_available ? toPriceFormat(item.final_price) : "Нет в наличии · не в сумме"}
              </span>
            </div>
          ))}
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
      {!currentUser?.marketing_consent ? (
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

const getDateOptions = (): Array<{ label: string; subLabel: string; value: string }> => {
  const now = new Date();

  return [0, 1, 2, 3].map((offset) => {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const label =
      offset === 0
        ? "Сегодня"
        : offset === 1
          ? "Завтра"
          : offset === 2
            ? "Послезавтра"
            : new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(d);
    const subLabel = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(d);

    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      subLabel,
      value: formatDateValue(d),
    };
  });
};

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
