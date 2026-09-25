"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/shared/api";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { normalizePhoneNumber } from "@/shared/lib/format/phone";
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
import type {
  DeliveryCalculateResponse,
  DeliveryOptionsResponse,
  DeliveryTimeSlotResponse,
  DeliveryTimeSlotsResponse,
  PickupPointListResponse,
} from "@/entities/delivery";
import { orderApi, type OrderCreateRequest, type OrderCreateResponse } from "@/entities/order";
import { paymentApi, type PaymentCreateResponse } from "@/entities/payment";
import type { AddressListResponse, AddressResponse, ProfileUserResponse } from "@/entities/profile";
import { formatPhoneMask } from "@/shared/lib/format/phone";
import { cn, ROUTES, STORE_INFO } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Button, Container } from "@/shared/ui";
import { PhoneVerificationModal } from "@/widgets/profile/ui/PhoneVerificationModal";

interface CheckoutViewProps {
  addresses: AddressListResponse;
  cart: CartResponse;
  deliveryCalculation: DeliveryCalculateResponse;
  deliveryOptions: DeliveryOptionsResponse;
  pickupPoints: PickupPointListResponse;
  summary: CartSummaryResponse;
  timeSlots: DeliveryTimeSlotsResponse;
  currentUser?: ProfileUserResponse | null;
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
  addresses,
  cart,
  deliveryCalculation,
  deliveryOptions,
  pickupPoints,
  summary,
  timeSlots,
  currentUser,
}: CheckoutViewProps) => {
  const defaultAddress =
    addresses.items.find((address) => address.is_default) ?? addresses.items[0];
  const defaultPickupPoint = pickupPoints.items[0];
  const firstAvailableSlot = timeSlots.items.find((slot) => slot.available) ?? timeSlots.items[0];

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
  const [substitutionPolicy, setSubstitutionPolicy] = useState<"call" | "replace" | "remove">("call");
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? null);
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
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    Boolean(currentUser?.is_phone_verified ?? currentUser?.is_verified)
  );
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [idempotencyKey] = useState(() => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  });

  useEffect(() => {
    if (currentUser) {
      setIsPhoneVerified(Boolean(currentUser.is_phone_verified ?? currentUser.is_verified));
    }
  }, [currentUser]);

  const selectedAddress = useMemo(() => {
    return addresses.items.find((address) => address.id === selectedAddressId) ?? defaultAddress;
  }, [addresses.items, defaultAddress, selectedAddressId]);

  const selectedPickupPoint = useMemo(() => {
    return (
      pickupPoints.items.find((point) => point.id === selectedPickupPointId) ?? defaultPickupPoint
    );
  }, [defaultPickupPoint, pickupPoints.items, selectedPickupPointId]);

  const selectedSlot = useMemo(() => {
    return timeSlots.items.find((slot) => slot.id === selectedSlotId) ?? firstAvailableSlot;
  }, [firstAvailableSlot, selectedSlotId, timeSlots.items]);

  const isOutsideKizlyar = useMemo(() => {
    if (deliveryType !== "delivery" || !selectedAddress) return false;
    const city = (selectedAddress.city || "").trim().toLowerCase();
    return city !== "" && city !== "кизляр";
  }, [deliveryType, selectedAddress]);

  const deliveryPrice = deliveryType === "pickup" ? "0" : (
    summary.delivery_price ??
    deliveryCalculation.delivery_price ??
    deliveryOptions.delivery.base_price ??
    "199.00"
  );

  const itemsCount = cart.items.length;
  const itemsTotal = Number(summary.subtotal || summary.final_price || 0);
  const minOrderAmount = Number(deliveryCalculation.min_order_amount || deliveryOptions.delivery.min_order_amount || 1000);
  const isMinOrderMet = itemsCount > 0 && (deliveryType === "pickup" || itemsTotal >= minOrderAmount);

  const currentStep = useMemo(() => {
    if (order) return 6;
    if (paymentMethod && (selectedSlotId || selectedDate)) return 5;
    if (selectedSlotId || selectedDate) return 4;
    if (deliveryType === "pickup" ? selectedPickupPointId : selectedAddressId) return 3;
    if (contact.name && contact.phone) return 2;
    return 1;
  }, [contact.name, contact.phone, deliveryType, order, paymentMethod, selectedAddressId, selectedDate, selectedPickupPointId, selectedSlotId]);

  const handleContactChange = (field: keyof ContactState, value: string): void => {
    setContact((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateOrder = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrorMessage(null);


    if (!isPhoneVerified) {
      setIsVerifyModalOpen(true);
      setErrorMessage("Для оформления заказа необходимо подтвердить номер телефона по SMS.");
      return;
    }

    const request: OrderCreateRequest = {
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      customer_name: contact.name,
      customer_phone: normalizePhoneNumber(contact.phone),
      customer_email: contact.email || null,
      delivery_date: selectedDate,
      delivery_time_slot_id: selectedSlot?.id ?? null,
      comment: null,
      use_points: usePoints > 0 ? usePoints : 0,
      leave_at_door: leaveAtDoor,
      dont_ring_doorbell: dontRingDoorbell,
      substitution_policy: substitutionPolicy,
      apartment: apartment.trim() || null,
      entrance: entrance.trim() || null,
      floor: floor.trim() || null,
      intercom: intercom.trim() || null,
    };

    const minAmount = deliveryCalculation.min_order_amount 
      ? Number(deliveryCalculation.min_order_amount) 
      : (deliveryOptions.delivery.min_order_amount ? Number(deliveryOptions.delivery.min_order_amount) : 0);

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
      request.pickup_point_id = null;
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
      setErrorMessage(`Минимальная сумма заказа для доставки — ${minOrderAmount} ₽. Добавьте товаров еще на ${minOrderAmount - itemsTotal} ₽.`);
      return;
    }

    if (deliveryType === "delivery" && isOutsideKizlyar) {
      setErrorMessage("К сожалению, по данному адресу доставка не осуществляется. Доступен только самовывоз в г. Кизляр.");
      return;
    }

    if (paymentMethod === "on_delivery" && !isPhoneVerified) {
      setIsVerifyModalOpen(true);
      setErrorMessage("Для оплаты при получении требуется подтверждение номера телефона по SMS.");
      return;
    }

    startTransition(async () => {
      try {
        const createdOrder = await orderApi.create(request, idempotencyKey);
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
        } else {
          setErrorMessage("Не удалось создать заказ. Проверьте данные и попробуйте еще раз.");
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

        <CheckoutSteps activeStep={currentStep} />

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]"
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
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800">Пожелания к доставке и сборке</h4>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Кв. / Офис</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                        placeholder="12"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Подъезд</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                        placeholder="1"
                        value={entrance}
                        onChange={(e) => setEntrance(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Этаж</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                        placeholder="3"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Домофон</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                        placeholder="12К"
                        value={intercom}
                        onChange={(e) => setIntercom(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-4 pb-1">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                        checked={leaveAtDoor}
                        onChange={(e) => setLeaveAtDoor(e.target.checked)}
                      />
                      <span>Оставить заказ у двери</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                        checked={dontRingDoorbell}
                        onChange={(e) => setDontRingDoorbell(e.target.checked)}
                      />
                      <span>Не звонить в звонок (спит ребёнок)</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-800 mb-3">
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
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                            substitutionPolicy === p.value
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Зона и стоимость доставки по Кизляру (Интегрировано в шаг 3) */}
                <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                        <Truck size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Зона доставки: {isOutsideKizlyar ? "Вне зоны курьерской доставки" : (deliveryCalculation.zone?.name || "Кизляр — Центральный")}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {isOutsideKizlyar 
                            ? "Доставка осуществляется по г. Кизляр и пригородным поселкам" 
                            : `Тариф доставки: ${deliveryPrice === "0" ? "Бесплатно" : `${deliveryPrice} ₽`} (бесплатно от ${toPriceFormat(deliveryCalculation.free_delivery_from || 3000)})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-black text-emerald-800">
                        {isOutsideKizlyar ? "Недоступно" : deliveryPrice === "0" ? "0 ₽" : `${deliveryPrice} ₽`}
                      </span>
                    </div>
                  </div>

                  {isOutsideKizlyar ? (
                    <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-800 font-medium">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-0.5">
                        <AlertCircle size={15} className="shrink-0 text-rose-600" />
                        <span>Адрес за пределами зоны доставки</span>
                      </div>
                      <p className="leading-relaxed">
                        К сожалению, по данному адресу курьерская доставка не осуществляется. Доступен только самовывоз из магазина в г. Кизляр.
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("pickup")}
                        className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                      >
                        Переключить на самовывоз
                      </button>
                    </div>
                  ) : null}
                </div>
                </>
              ) : (
                <PickupSelector
                  pickupPoints={pickupPoints.items}
                  selectedPickupPointId={selectedPickupPointId}
                  onSelect={setSelectedPickupPointId}
                />
              )}
            </CheckoutSection>

            <CheckoutSection icon={<Calendar size={24} />} number={4} title="Дата и временной слот">
              <DateAndSlotPicker
                selectedDate={selectedDate}
                selectedSlotId={selectedSlotId}
                slots={timeSlots.items}
                onDateChange={setSelectedDate}
                onSlotChange={setSelectedSlotId}
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
              <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-4.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
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
              deliveryCalculation={deliveryCalculation}
              deliveryPrice={deliveryPrice}
              deliveryType={deliveryType}
              isPending={isPending}
              order={order}
              payment={payment}
              summary={summary}
              itemsCount={itemsCount}
              itemsTotal={itemsTotal}
              minOrderAmount={minOrderAmount}
              isPhoneVerified={isPhoneVerified}
              onOpenVerifyModal={() => setIsVerifyModalOpen(true)}
              marketingConsent={marketingConsent}
              onMarketingConsentChange={setMarketingConsent}
            />
            <CheckoutBenefits
              itemsTotal={itemsTotal}
              freeFrom={Number(deliveryCalculation.free_delivery_from || deliveryOptions.delivery.free_from_amount || 3000)}
            />
          </aside>
        </form>
        <PhoneVerificationModal
          isOpen={isVerifyModalOpen}
          phone={contact.phone || currentUser?.phone || ""}
          onClose={() => setIsVerifyModalOpen(false)}
          onSuccess={() => {
            setIsPhoneVerified(true);
            setErrorMessage(null);
          }}
        />
      </Container>
    </main>
  );
};

interface CheckoutStepsProps {
  activeStep: number;
}

const CheckoutSteps = ({ activeStep }: CheckoutStepsProps) => {
  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ol className="flex min-w-[560px] md:min-w-0 md:grid md:grid-cols-6 gap-3 pr-8 md:pr-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= activeStep;

          return (
            <li className="relative flex flex-1 items-center gap-2.5 md:block md:text-center shrink-0" key={step}>
              <span
                className={cn(
                  "relative z-10 grid size-8 md:size-9 shrink-0 place-items-center rounded-full border text-xs md:text-sm font-bold transition",
                  isActive
                    ? "border-accent-primary bg-accent-primary text-accent-contrast shadow-xs"
                    : "border-border bg-bg-primary text-text-muted",
                )}
              >
                {stepNumber}
              </span>
              {stepNumber < steps.length ? (
                <span className="bg-border absolute top-4 left-1/2 hidden h-px w-full md:block" />
              ) : null}
              <p
                className={cn(
                  "text-xs md:text-sm leading-tight md:mt-2 truncate max-w-[85px] md:max-w-none",
                  isActive ? "text-accent-primary font-bold" : "text-text-secondary",
                )}
              >
                {step}
              </p>
            </li>
          );
        })}
      </ol>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent md:hidden" />
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
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
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
  onChange: (value: string) => void;
}

const Field = ({ label, onChange, type = "text", value }: FieldProps) => {
  return (
    <label className="block">
      <span className="text-text-secondary mb-2 block text-sm">{label}</span>
      <input
        className="border-border focus:border-accent-primary h-12 w-full rounded-lg border px-4 text-sm transition outline-none"
        required={label !== "Email"}
        type={type}
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
        "grid min-h-18 grid-cols-[24px_1fr] items-center gap-4 rounded-lg border p-4 text-left transition",
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
    ? COMMON_ADDRESS_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase().trim()),
      )
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" />
            Быстрое добавление адреса
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1">
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
              <div className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-1">
                  {filtered.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => handleSelect(s)}
                      className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
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
  const [customAddresses, setCustomAddresses] = useState<Array<{ id: number; title: string; city: string }>>([]);

  const handleAddCustom = (fullAddress: string) => {
    const newId = Date.now();
    setCustomAddresses((prev) => [...prev, { id: newId, title: fullAddress, city: STORE_INFO.city }]);
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
          className="self-start w-full text-xs font-bold"
          variant="secondary"
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          + Быстрый адрес
        </Button>
        <Link href={ROUTES.PROFILE_ADDRESSES} className="text-[11px] text-slate-400 hover:text-emerald-700 text-center">
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
  onDateChange: (date: string) => void;
  onSlotChange: (slotId: number) => void;
}

const DateAndSlotPicker = ({
  onDateChange,
  onSlotChange,
  selectedDate,
  selectedSlotId,
  slots,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {dateOptions.map((option) => {
          const isSelected = selectedDate === option.value;
          return (
            <button
              className={cn(
                "flex h-14 min-w-32 flex-col items-center justify-center rounded-2xl border px-5 transition-all active:scale-98 cursor-pointer",
                isSelected
                  ? "border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-xs ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
              type="button"
              key={option.value}
              onClick={() => onDateChange(option.value)}
            >
              <span className="text-sm font-bold">{option.label}</span>
              <span className="text-xs text-slate-400">{option.subLabel}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2.5">
          Выберите удобный интервал доставки:
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {processedSlots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            return (
              <button
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl border px-3 text-xs font-bold transition-all active:scale-98",
                  isSelected && slot.available
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-700/20"
                    : slot.available
                      ? "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
                      : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through opacity-60"
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
        {isToday && processedSlots.every((s) => !s.available) ? (
          <p className="mt-2.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl p-3">
            🕒 Все интервалы доставки на сегодня уже завершены. Пожалуйста, выберите доставку на завтра.
          </p>
        ) : null}
      </div>
    </div>
  );
};

interface ReviewListProps {
  items: CartItemResponse[];
}

const ReviewList = ({ items }: ReviewListProps) => {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          className="grid grid-cols-[52px_minmax(0,1fr)_80px_60px_90px] items-center gap-3"
          key={item.id}
        >
          <ProductThumb item={item} size={48} />
          <div className="min-w-0">
            <p className="truncate font-bold">{item.name}</p>
            <p className="text-text-secondary text-sm">
              {formatQuantity(item.quantity)} {item.unit}
            </p>
          </div>
          <span className="font-semibold">{toPriceFormat(item.price)}</span>
          <span className="text-text-secondary text-center">x {formatQuantity(item.quantity)}</span>
          <span className="text-right font-semibold">{toPriceFormat(item.final_price)}</span>
        </div>
      ))}
    </div>
  );
};

interface OrderSummaryProps {
  cart: CartResponse;
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
  isPhoneVerified: boolean;
  onOpenVerifyModal: () => void;
  marketingConsent: boolean;
  onMarketingConsentChange: (value: boolean) => void;
}

const OrderSummary = ({
  cart,
  deliveryCalculation,
  deliveryPrice,
  deliveryType,
  isPending,
  order,
  payment,
  summary,
  itemsCount,
  itemsTotal,
  minOrderAmount,
  isPhoneVerified,
  onOpenVerifyModal,
  marketingConsent,
  onMarketingConsentChange,
}: OrderSummaryProps) => {
  const finalWithDelivery = Number(summary.final_price) + Number(deliveryPrice);
  const freeFrom = Number(deliveryCalculation.free_delivery_from || 3000);
  const amountLeft = Math.max(0, freeFrom - itemsTotal);
  const isMinOrderMet = itemsCount > 0 && (deliveryType === "pickup" || itemsTotal >= minOrderAmount);

  return (
    <section className="border-border bg-bg-primary rounded-2xl border p-5 shadow-[0_14px_40px_rgb(20_28_18/0.08)]">
      <h2 className="mb-5 text-xl font-bold text-slate-900">Ваш заказ</h2>

      {itemsCount === 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-800 space-y-2">
          <p className="font-bold text-sm">Корзина пуста</p>
          <p className="text-slate-600 font-normal">Добавьте товары из каталога для оформления заказа.</p>
          <Link
            href={ROUTES.CATALOG}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
          {cart.items.map((item) => (
            <div
              className="grid grid-cols-[56px_minmax(0,1fr)_75px] items-center gap-3"
              key={item.id}
            >
              <ProductThumb item={item} size={56} />
              <div className="min-w-0">
                <p className="truncate font-bold text-xs sm:text-sm">{item.name}</p>
                <p className="text-text-secondary text-xs">
                  {formatQuantity(item.quantity)} {item.unit}
                </p>
                <p className="text-text-secondary text-[11px]">
                  {toPriceFormat(item.price)} x {formatQuantity(item.quantity)}
                </p>
              </div>
              <span className="text-right font-bold text-xs sm:text-sm">{toPriceFormat(item.final_price)}</span>
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
          value={deliveryPrice === "0" ? "Бесплатно (0 ₽)" : toPriceFormat(deliveryPrice)} 
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-xl font-bold">Итого</span>
        <span className="text-3xl font-black text-slate-900">{toPriceFormat(finalWithDelivery)}</span>
      </div>

      {deliveryType === "delivery" && itemsTotal < minOrderAmount ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 font-medium">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>Минимальная сумма для доставки — {toPriceFormat(minOrderAmount)}</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-800">
            В корзине на <strong className="font-bold">{toPriceFormat(itemsTotal)}</strong>. Не хватает{" "}
            <strong className="font-bold text-emerald-800">{toPriceFormat(minOrderAmount - itemsTotal)}</strong>.
          </p>
          <Link href={ROUTES.CATALOG} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
            Добавить товары из каталога →
          </Link>
        </div>
      ) : null}

      {!isPhoneVerified ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <span>Требуется подтверждение телефона</span>
          </div>
          <p className="text-amber-800 leading-relaxed mb-2 text-[11px]">
            Для защиты от спама при оплате при получении подтвердите номер по SMS.
          </p>
          <button
            type="button"
            onClick={onOpenVerifyModal}
            className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
          >
            Подтвердить телефон по SMS
          </button>
        </div>
      ) : null}

      <Button
        className="mt-5 h-14 w-full text-base font-bold shadow-md shadow-emerald-700/20"
        type="submit"
        disabled={
          isPending || 
          itemsCount === 0 || 
          !isMinOrderMet ||
          (!isPhoneVerified) ||
          Boolean(order)
        }
      >
        {isPending ? (
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
        ) : !isPhoneVerified ? (
          "Подтвердите телефон"
        ) : (
          "Создать заказ"
        )}
      </Button>

      {order ? (
        <div className="bg-emerald-50 border border-emerald-200 mt-4 rounded-xl p-3.5 text-xs text-emerald-900">
          <p className="font-bold">Заказ № {order.order_number} успешно оформлен!</p>
          {payment?.payment_url ? (
            <a className="text-emerald-700 mt-1.5 block font-bold underline hover:text-emerald-800" href={payment.payment_url}>
              Перейти к оплате онлайн →
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Прогресс-бар бесплатной доставки */}
      {freeFrom > 0 && deliveryType === "delivery" ? (
        <div className="bg-emerald-50/60 border border-emerald-100 mt-4 rounded-xl p-3 text-xs">
          <div className="mb-1.5 flex items-center justify-between text-slate-700">
            <span className="font-semibold text-[11px]">
              {amountLeft === 0 ? "Бесплатная доставка активна! 🎉" : "До бесплатной доставки:"}
            </span>
            <span className="font-black text-emerald-800 text-[11px]">
              {amountLeft === 0 ? "0 ₽" : toPriceFormat(amountLeft)}
            </span>
          </div>
          <div className="bg-emerald-200/50 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
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
        <Link className="text-emerald-700 font-semibold hover:underline" href={ROUTES.OFFER} target="_blank">
          Публичной оферты
        </Link>{" "}
        и даете{" "}
        <Link className="text-emerald-700 font-semibold hover:underline" href={ROUTES.PERSONAL_DATA_CONSENT} target="_blank">
          Согласие на обработку персональных данных
        </Link>{" "}
        в соответствии с{" "}
        <Link className="text-emerald-700 font-semibold hover:underline" href={ROUTES.PRIVACY} target="_blank">
          Политикой конфиденциальности
        </Link>
        .
      </p>

      {/* Опциональное согласие на маркетинговые рассылки (38-ФЗ) */}
      <label className="mt-3 flex items-start gap-2.5 text-[11px] text-slate-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => onMarketingConsentChange(e.target.checked)}
          className="mt-0.5 size-4 rounded accent-emerald-600"
        />
        <span>Получать персональные скидки, промокоды и уведомления об акциях (38-ФЗ)</span>
      </label>
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
      <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-emerald-50/70 to-teal-50/40">
        <span className="text-emerald-600 shrink-0">
          <Truck size={24} />
        </span>
        <div>
          <p className="font-bold text-slate-900 text-sm">
            {isFree ? "Бесплатная доставка активна! 🎉" : "До бесплатной доставки"}
          </p>
          {isFree ? (
            <p className="text-slate-600 mt-1 text-xs">
              Ваш заказ доставляется курьером за 0 ₽
            </p>
          ) : (
            <p className="text-slate-600 mt-1 text-xs">
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
  size: number;
}

const ProductThumb = ({ item, size }: ProductThumbProps) => {
  return (
    <span
      className="grid place-items-center rounded-lg bg-white"
      style={{ height: size, width: size }}
    >
      {item.preview_image_url ? (
        <Image
          alt={item.name}
          className="h-full w-full object-contain"
          height={size}
          src={item.preview_image_url}
          width={size}
        />
      ) : (
        <ShoppingBag className="text-accent-primary" size={Math.round(size / 2)} />
      )}
    </span>
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

  return [0, 1].map((offset) => {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const label = offset === 0 ? "Сегодня" : "Завтра";
    const subLabel = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(d);

    return {
      label,
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
