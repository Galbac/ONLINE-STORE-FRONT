"use client";

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
import type { AddressListResponse, AddressResponse } from "@/entities/profile";
import { cn, ROUTES, STORE_INFO } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Button, Container } from "@/shared/ui";

interface CheckoutViewProps {
  addresses: AddressListResponse;
  cart: CartResponse;
  deliveryCalculation: DeliveryCalculateResponse;
  deliveryOptions: DeliveryOptionsResponse;
  pickupPoints: PickupPointListResponse;
  summary: CartSummaryResponse;
  timeSlots: DeliveryTimeSlotsResponse;
}

interface ContactState {
  name: string;
  phone: string;
  email: string;
}

type DeliveryType = "delivery" | "pickup";
type PaymentMethod = "online" | "on_delivery";

const steps = [
  "Контактные данные",
  "Доставка или самовывоз",
  "Адрес или точка самовывоза",
  "Дата и временной слот",
  "Способ оплаты",
  "Проверка заказа",
  "Создание заказа",
] as const;

export const CheckoutView = ({
  addresses,
  cart,
  deliveryCalculation,
  deliveryOptions,
  pickupPoints,
  summary,
  timeSlots,
}: CheckoutViewProps) => {
  const defaultAddress =
    addresses.items.find((address) => address.is_default) ?? addresses.items[0];
  const defaultPickupPoint = pickupPoints.items[0];
  const firstAvailableSlot = timeSlots.items.find((slot) => slot.available) ?? timeSlots.items[0];

  const [contact, setContact] = useState<ContactState>({
    name: "",
    phone: "",
    email: "",
  });
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
  const [personalDataAgreement, setPersonalDataAgreement] = useState(false);
  const [order, setOrder] = useState<OrderCreateResponse | null>(null);
  const [payment, setPayment] = useState<PaymentCreateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  const deliveryPrice =
    summary.delivery_price ??
    deliveryCalculation.delivery_price ??
    deliveryOptions.delivery.base_price ??
    "0";

  const handleContactChange = (field: keyof ContactState, value: string): void => {
    setContact((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateOrder = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrorMessage(null);

    if (!personalDataAgreement) {
      setErrorMessage("Подтвердите согласие на обработку персональных данных.");
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

    startTransition(async () => {
      try {
        const createdOrder = await orderApi.create(request);
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
      } catch {
        setErrorMessage("Не удалось создать заказ. Проверьте данные и попробуйте еще раз.");
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

        <CheckoutSteps activeStep={order ? 7 : 1} />

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
                </>
              ) : (
                <PickupSelector
                  pickupPoints={pickupPoints.items}
                  selectedPickupPointId={selectedPickupPointId}
                  onSelect={setSelectedPickupPointId}
                />
              )}
            </CheckoutSection>

            <CheckoutSection
              icon={<Truck size={24} />}
              number={4}
              title="Стоимость и зона доставки"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="text-text-secondary text-sm">
                  <span>Зона доставки: </span>
                  <span className="text-text-primary font-semibold">
                    {deliveryCalculation.zone?.name ??
                      selectedAddress?.city ??
                      selectedPickupPoint?.city ??
                      "Не выбрана"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-sm">Стоимость доставки:</p>
                  <p className="text-2xl font-bold">{toPriceFormat(deliveryPrice)}</p>
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection icon={<Calendar size={24} />} number={5} title="Дата и временной слот">
              <DateAndSlotPicker
                selectedDate={selectedDate}
                selectedSlotId={selectedSlotId}
                slots={timeSlots.items}
                onDateChange={setSelectedDate}
                onSlotChange={setSelectedSlotId}
              />
            </CheckoutSection>

            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Бонусные баллы</h4>
                  <p className="text-xs text-slate-500">Спишите бонусы программы лояльности (1 бонус = 1 ₽)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={loyaltyBalance > 0 ? loyaltyBalance : undefined}
                  className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  placeholder="0 бонусов"
                  value={usePoints || ""}
                  onChange={(e) => setUsePoints(Math.max(0, Math.min(Number(e.target.value) || 0, loyaltyBalance > 0 ? loyaltyBalance : Infinity)))}
                />
                <span className="text-xs font-bold text-slate-600">₽</span>
              </div>
            </div>

            <CheckoutSection icon={<CreditCard size={24} />} number={6} title="Способ оплаты">
              <div className="grid gap-4 md:grid-cols-2">
                <ChoiceCard
                  checked={paymentMethod === "online"}
                  title="Онлайн-оплата"
                  text="Банковской картой на сайте"
                  onClick={() => setPaymentMethod("online")}
                />
                <ChoiceCard
                  checked={paymentMethod === "on_delivery"}
                  title="Оплата при получении"
                  text="Наличными или картой курьеру"
                  onClick={() => setPaymentMethod("on_delivery")}
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={<ClipboardCheck size={24} />}
              number={7}
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
              personalDataAgreement={personalDataAgreement}
              isPending={isPending}
              order={order}
              payment={payment}
              summary={summary}
              onPersonalDataAgreementChange={setPersonalDataAgreement}
            />
            <CheckoutBenefits />
          </aside>
        </form>
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
        <ol className="flex min-w-[560px] md:min-w-0 md:grid md:grid-cols-7 gap-3 pr-8 md:pr-0">
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
  const dateOptions = getDateOptions(selectedDate);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(5,86px)_1fr]">
        {dateOptions.map((option) => (
          <button
            className={cn(
              "h-14 rounded-lg border px-3 text-sm font-semibold transition",
              selectedDate === option.value
                ? "border-accent-primary bg-bg-hover text-accent-primary"
                : "border-border hover:bg-bg-secondary",
            )}
            type="button"
            key={option.value}
            onClick={() => onDateChange(option.value)}
          >
            {option.label}
          </button>
        ))}
        <button
          className="border-border hover:bg-bg-secondary flex h-14 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition"
          type="button"
        >
          <Calendar size={18} />
          Выбрать дату
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {slots.map((slot) => (
          <button
            className={cn(
              "h-11 rounded-lg border px-3 text-sm transition",
              selectedSlotId === slot.id
                ? "border-accent-primary bg-bg-hover text-accent-primary font-bold"
                : "border-border hover:bg-bg-secondary",
              !slot.available && "cursor-not-allowed opacity-45",
            )}
            type="button"
            disabled={!slot.available}
            key={slot.id}
            onClick={() => onSlotChange(slot.id)}
          >
            {slot.label}
          </button>
        ))}
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
  personalDataAgreement: boolean;
  isPending: boolean;
  order: OrderCreateResponse | null;
  payment: PaymentCreateResponse | null;
  summary: CartSummaryResponse;
  onPersonalDataAgreementChange: (checked: boolean) => void;
}

const OrderSummary = ({
  cart,
  deliveryCalculation,
  deliveryPrice,
  personalDataAgreement,
  isPending,
  order,
  onPersonalDataAgreementChange,
  payment,
  summary,
}: OrderSummaryProps) => {
  const finalWithDelivery = Number(summary.final_price) + Number(deliveryPrice);
  const amountLeft = deliveryCalculation.amount_left_for_free_delivery;
  const freeFrom = deliveryCalculation.free_delivery_from;

  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-[0_14px_40px_rgb(20_28_18/0.08)]">
      <h2 className="mb-6 text-xl font-bold">Ваш заказ</h2>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            className="grid grid-cols-[70px_minmax(0,1fr)_80px] items-center gap-3"
            key={item.id}
          >
            <ProductThumb item={item} size={64} />
            <div className="min-w-0">
              <p className="truncate font-bold">{item.name}</p>
              <p className="text-text-secondary text-sm">
                {formatQuantity(item.quantity)} {item.unit}
              </p>
              <p className="text-text-secondary text-xs">
                {toPriceFormat(item.price)} x {formatQuantity(item.quantity)}
              </p>
            </div>
            <span className="text-right font-bold">{toPriceFormat(item.final_price)}</span>
          </div>
        ))}
      </div>

      <div className="border-border mt-6 space-y-4 border-y py-5">
        <SummaryLine
          label={`Товары (${summary.items_count})`}
          value={toPriceFormat(summary.subtotal)}
        />
        <SummaryLine
          label="Скидка на товары"
          value={`-${toPriceFormat(summary.discount_amount)}`}
          danger
        />
        <SummaryLine
          label={`Промокод${summary.promo_code ? ` (${summary.promo_code})` : ""}`}
          value={`-${toPriceFormat(summary.promo_discount_amount)}`}
          danger
        />
        <SummaryLine label="Доставка" value={toPriceFormat(deliveryPrice)} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <span className="text-xl font-bold">Итого</span>
        <span className="text-3xl font-bold">{toPriceFormat(finalWithDelivery)}</span>
      </div>

      <div className="mt-6 space-y-3">
        <label className="flex items-start gap-3 text-sm leading-6 cursor-pointer select-none">
          <input
            className="border-border mt-1 size-5 rounded accent-[var(--color-accent-primary)] cursor-pointer"
            checked={personalDataAgreement}
            type="checkbox"
            onChange={(event) => onPersonalDataAgreementChange(event.target.checked)}
          />
          <span className="text-text-secondary text-xs sm:text-sm">
            <span className="text-red-500 font-bold">* </span>
            Я даю{" "}
            <Link className="text-accent-primary font-semibold hover:underline" href={ROUTES.PERSONAL_DATA_CONSENT}>
              согласие на обработку персональных данных
            </Link>
            , принимаю{" "}
            <Link className="text-accent-primary font-semibold hover:underline" href={ROUTES.PRIVACY}>
              политику обработки персональных данных (152-ФЗ)
            </Link>{" "}
            и{" "}
            <Link className="text-accent-primary font-semibold hover:underline" href={ROUTES.OFFER}>
              публичную оферту
            </Link>
          </span>
        </label>
      </div>

      {deliveryCalculation.min_order_amount && Number(summary.final_price) < Number(deliveryCalculation.min_order_amount) ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Минимальная сумма заказа для оформления — {toPriceFormat(deliveryCalculation.min_order_amount)}
        </div>
      ) : null}

      <Button
        className="mt-4 h-14 w-full text-base"
        type="submit"
        disabled={
          isPending || 
          cart.items.length === 0 || 
          !personalDataAgreement ||
          (deliveryCalculation.min_order_amount !== null && deliveryCalculation.min_order_amount !== undefined && Number(summary.final_price) < Number(deliveryCalculation.min_order_amount))
        }
      >
        {order ? "Заказ создан" : "Создать заказ"}
      </Button>

      {order ? (
        <div className="bg-bg-hover mt-4 rounded-lg p-4 text-sm">
          <p className="font-bold">№ {order.order_number}</p>
          {payment ? (
            <a className="text-accent-primary mt-2 block font-semibold" href={payment.payment_url}>
              Перейти к оплате
            </a>
          ) : null}
        </div>
      ) : null}

      {amountLeft && freeFrom ? (
        <div className="bg-bg-hover mt-5 rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span>До бесплатной доставки осталось</span>
            <span className="font-bold">{toPriceFormat(amountLeft)}</span>
          </div>
          <div className="bg-border h-2 overflow-hidden rounded-full">
            <div
              className="bg-accent-primary h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(8, (Number(summary.final_price) / Number(freeFrom)) * 100))}%`,
              }}
            />
          </div>
          <p className="text-text-muted mt-2 text-sm">
            Бесплатная доставка от {toPriceFormat(freeFrom)}
          </p>
        </div>
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

const CheckoutBenefits = () => {
  return (
    <section className="border-border bg-bg-primary divide-border overflow-hidden rounded-lg border shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <Benefit
        icon={<Truck size={24} />}
        title="До бесплатной доставки"
        text="Условия считаются по корзине"
      />
      <Benefit
        icon={<ShieldCheck size={24} />}
        title="Безопасная оплата"
        text="Оплата онлайн или курьеру"
      />
      <Benefit
        icon={<PackageCheck size={24} />}
        title="Свежие продукты"
        text="Гарантия качества каждый день"
      />
      <Benefit
        icon={<LockKeyhole size={24} />}
        title="Защита данных"
        text="Ваши данные под надёжной защитой"
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

const getDateOptions = (selectedDate: string): Array<{ label: string; value: string }> => {
  const [year = 2026, month = 5, day = 22] = selectedDate.split("-").map(Number);
  const baseDate = new Date(year, month - 1, day);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    const label =
      index === 0
        ? "Сегодня"
        : index === 1
          ? "Завтра"
          : new Intl.DateTimeFormat("ru-RU", {
              timeZone: "Europe/Moscow",
              weekday: "short",
            }).format(date);
    const dayMonth = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "short",
    }).format(date);

    return {
      label: `${label}\n${dayMonth}`,
      value: formatDateValue(date),
    };
  });
};

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
