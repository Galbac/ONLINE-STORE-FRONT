"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Truck,
  UserRound,
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
import { cn, ROUTES } from "@/shared/config";
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
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? null);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState(
    defaultPickupPoint?.id ?? null,
  );
  const [selectedDate, setSelectedDate] = useState(timeSlots.date);
  const [selectedSlotId, setSelectedSlotId] = useState(firstAvailableSlot?.id ?? null);
  const [order, setOrder] = useState<OrderCreateResponse | null>(null);
  const [payment, setPayment] = useState<PaymentCreateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    const request: OrderCreateRequest = {
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      customer_name: contact.name,
      customer_phone: contact.phone,
      customer_email: contact.email || null,
      delivery_date: selectedDate,
      delivery_time_slot_id: selectedSlot?.id ?? null,
      comment: null,
    };

    if (deliveryType === "delivery") {
      request.address_id = selectedAddress?.id ?? null;
      request.pickup_point_id = null;
    } else {
      request.address_id = null;
      request.pickup_point_id = selectedPickupPoint?.id ?? null;
    }

    startTransition(async () => {
      try {
        const createdOrder = await orderApi.create(request);
        setOrder(createdOrder);

        if (paymentMethod === "online") {
          const createdPayment = await paymentApi.create({ order_id: createdOrder.id });
          setPayment(createdPayment);
        }
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
                <AddressSelector
                  addresses={addresses.items}
                  selectedAddressId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                />
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
              isPending={isPending}
              order={order}
              payment={payment}
              summary={summary}
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
    <ol className="grid gap-3 md:grid-cols-7">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= activeStep;

        return (
          <li className="relative flex items-center gap-3 md:block md:text-center" key={step}>
            <span
              className={cn(
                "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border text-sm font-bold",
                isActive
                  ? "border-accent-primary bg-accent-primary text-accent-contrast"
                  : "border-border bg-bg-primary text-text-primary",
              )}
            >
              {stepNumber}
            </span>
            {stepNumber < steps.length ? (
              <span className="bg-border absolute top-4 left-1/2 hidden h-px w-full md:block" />
            ) : null}
            <p
              className={cn(
                "text-sm leading-5 md:mt-3",
                isActive ? "text-accent-primary font-bold" : "text-text-secondary",
              )}
            >
              {step}
            </p>
          </li>
        );
      })}
    </ol>
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

interface AddressSelectorProps {
  addresses: AddressResponse[];
  selectedAddressId: number | null;
  onSelect: (addressId: number) => void;
}

const AddressSelector = ({ addresses, onSelect, selectedAddressId }: AddressSelectorProps) => {
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
      </div>
      <Button className="self-start" variant="secondary" type="button">
        Добавить адрес
      </Button>
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
  isPending: boolean;
  order: OrderCreateResponse | null;
  payment: PaymentCreateResponse | null;
  summary: CartSummaryResponse;
}

const OrderSummary = ({
  cart,
  deliveryCalculation,
  deliveryPrice,
  isPending,
  order,
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

      <Button
        className="mt-6 h-14 w-full text-base"
        type="submit"
        disabled={isPending || cart.items.length === 0}
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
          : new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date);
    const dayMonth = new Intl.DateTimeFormat("ru-RU", {
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
