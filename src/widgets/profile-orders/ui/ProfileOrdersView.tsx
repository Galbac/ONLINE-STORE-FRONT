"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  ChevronRight,
  CreditCard,
  Headphones,
  Info,
  PackageCheck,
  Percent,
  RefreshCcw,
  Store,
  Truck,
} from "lucide-react";
import { orderApi, type OrderShortResponse } from "@/entities/order";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { Button, Container } from "@/shared/ui";

interface ProfileOrdersViewProps {
  initialOrders: {
    items: OrderShortResponse[];
  };
}

type OrderFilter = "all" | "new" | "processing" | "completed" | "cancelled";

interface FilterOption {
  label: string;
  value: OrderFilter;
}

const filterOptions: FilterOption[] = [
  { label: "Все заказы", value: "all" },
  { label: "Новые", value: "new" },
  { label: "В обработке", value: "processing" },
  { label: "Выполненные", value: "completed" },
  { label: "Отмененные", value: "cancelled" },
];

const serviceBenefits = [
  {
    title: "Качество продуктов",
    text: "Только свежие и проверенные товары каждый день",
    icon: BadgeCheck,
  },
  {
    title: "Доставка",
    text: "Быстрая доставка на дом и в удобное время",
    icon: Truck,
  },
  {
    title: "Выгодные цены",
    text: "Лучшие предложения и акции для вас",
    icon: Percent,
  },
  {
    title: "Поддержка 24/7",
    text: "Мы всегда на связи и готовы помочь",
    icon: Headphones,
  },
] as const;

export const ProfileOrdersView = ({ initialOrders }: ProfileOrdersViewProps) => {
  const [orders, setOrders] = useState<OrderShortResponse[]>(initialOrders.items);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("all");
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [datePeriod, setDatePeriod] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadOrders = async (): Promise<void> => {
      try {
        const response = await orderApi.getProfileOrders({ offset: 0, limit: 100 }, accessToken);

        if (isMounted) {
          setOrders(response.items);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Не удалось загрузить заказы.");
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!matchesFilter(order.status, activeFilter)) {
        return false;
      }
      if (searchNumber.trim()) {
        const query = searchNumber.trim().toLowerCase().replace("#", "");
        const matchesId = String(order.id).includes(query);
        const matchesNumber = order.order_number?.toLowerCase().includes(query) ?? false;
        if (!matchesId && !matchesNumber) return false;
      }
      if (datePeriod !== "all") {
        const orderDate = new Date(order.created_at).getTime();
        const now = Date.now();
        const days = datePeriod === "month" ? 30 : datePeriod === "3months" ? 90 : 365;
        if (now - orderDate > days * 24 * 60 * 60 * 1000) {
          return false;
        }
      }
      return true;
    });
  }, [activeFilter, datePeriod, orders, searchNumber]);

  const handleRepeatOrder = (order: OrderShortResponse): void => {
    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingOrderId(order.id);
        setErrorMessage(null);
        const response = await orderApi.repeatProfile(
          order.id,
          { replace_cart: false },
          accessToken,
        );
        const warningText =
          response.warnings.length > 0
            ? ` Добавлено с предупреждениями: ${response.warnings.length}.`
            : "";

        notifyCartChanged({ itemsCount: response.cart.items.length });
        setStatusMessage(`${response.message}${warningText} Товары добавлены в корзину.`);
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось повторить заказ. Возможно, товары недоступны.");
      } finally {
        setPendingOrderId(null);
      }
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-9 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <span>Заказы</span>
        </nav>

        <section className="mb-9">
          <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Мои заказы</h1>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            placeholder="Поиск по номеру заказа (#123)..."
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Период:</span>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="all">За всё время</option>
              <option value="month">За последний месяц</option>
              <option value="3months">За 3 месяца</option>
              <option value="year">За последний год</option>
            </select>
          </div>
        </div>
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <button
              className={cn(
                "h-12 shrink-0 rounded-lg border px-5 text-sm font-bold transition",
                activeFilter === option.value
                  ? "border-accent-primary bg-accent-primary text-accent-contrast"
                  : "border-border bg-bg-secondary text-text-primary hover:bg-bg-hover",
              )}
              key={option.value}
              type="button"
              onClick={() => setActiveFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {errorMessage ? (
          <StatusPanel tone="error" text={errorMessage} />
        ) : statusMessage ? (
          <StatusPanel tone="success" text={statusMessage} />
        ) : null}

        <section className="space-y-5">
          {visibleOrders.length > 0 ? (
            visibleOrders.map((order) => (
              <OrderCard
                isPending={isPending && pendingOrderId === order.id}
                key={order.id}
                order={order}
                onRepeat={handleRepeatOrder}
              />
            ))
          ) : (
            <EmptyOrders />
          )}
        </section>

        <section className="border-success/20 bg-bg-secondary mt-9 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex gap-4">
            <span className="bg-accent-primary text-accent-contrast grid size-12 shrink-0 place-items-center rounded-full">
              <Info size={26} />
            </span>
            <div>
              <p className="text-text-primary font-bold">Не нашли нужный заказ?</p>
              <p className="text-text-secondary mt-2 text-sm leading-6">
                Если у вас возникли вопросы по заказу, свяжитесь с нашей службой поддержки.
              </p>
            </div>
          </div>
          <Button className="w-full sm:w-auto" variant="secondary">
            Связаться с поддержкой
          </Button>
        </section>

        <section className="border-border mt-9 grid gap-5 rounded-lg border bg-white p-6 shadow-[0_10px_28px_rgb(20_28_18/0.04)] md:grid-cols-2 lg:grid-cols-4">
          {serviceBenefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div className="flex gap-4" key={benefit.title}>
                <span className="bg-bg-hover text-accent-primary grid size-14 shrink-0 place-items-center rounded-full border border-green-100">
                  <Icon size={28} />
                </span>
                <span>
                  <span className="block font-bold">{benefit.title}</span>
                  <span className="text-text-secondary mt-2 block text-sm leading-6">
                    {benefit.text}
                  </span>
                </span>
              </div>
            );
          })}
        </section>
      </Container>
    </main>
  );
};

interface OrderCardProps {
  isPending: boolean;
  order: OrderShortResponse;
  onRepeat: (order: OrderShortResponse) => void;
}


const ORDER_STATUS_STEPS = [
  { key: "created", label: "Принят" },
  { key: "confirmed", label: "Подтвержден" },
  { key: "assembling", label: "Сборка" },
  { key: "in_delivery", label: "В пути" },
  { key: "delivered", label: "Доставлен" },
];

const getStatusStepIndex = (status: string): number => {
  switch (status.toLowerCase()) {
    case "created":
    case "new":
    case "pending":
      return 0;
    case "confirmed":
    case "paid":
      return 1;
    case "assembling":
    case "processing":
      return 2;
    case "in_delivery":
    case "shipped":
      return 3;
    case "delivered":
    case "completed":
      return 4;
    default:
      return 0;
  }
};

const OrderStatusStepper = ({ status }: { status: string }) => {
  const isCancelled = status.toLowerCase().includes("cancel");
  if (isCancelled) {
    return (
      <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">
        Заказ отменен
      </div>
    );
  }

  const currentIdx = getStatusStepIndex(status);

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-slate-200 -z-0" />
        <div
          className="absolute left-3 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-600 transition-all duration-300 -z-0"
          style={{ width: `${(currentIdx / (ORDER_STATUS_STEPS.length - 1)) * 100}%` }}
        />
        {ORDER_STATUS_STEPS.map((step, idx) => {
          const isPassed = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition",
                  isPassed
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-400 border-2 border-slate-200",
                  isCurrent && "ring-3 ring-emerald-500/20",
                )}
              >
                {idx + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-semibold whitespace-nowrap",
                  isPassed ? "text-slate-800" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">
          {currentIdx === 4
            ? "✅ Заказ успешно доставлен"
            : currentIdx === 3
            ? "🚴 Курьер выехал: доставка ожидается в течение ~25 минут"
            : currentIdx >= 1
            ? "📦 Заказ в обработке, прибудет в указанное время"
            : "⏳ Заказ принят магазином"}
        </span>
        <span className="font-bold text-emerald-700">
          {currentIdx < 4 ? "Шаг " + (currentIdx + 1) + " из 5" : "Завершен"}
        </span>
      </div>
    </div>
  );
};

const OrderCard = ({ isPending, onRepeat, order }: OrderCardProps) => {
  const DeliveryIcon = order.delivery_type === "pickup" ? Store : Truck;
  const PaymentIcon = order.payment_method === "cash" ? Banknote : CreditCard;
  const status = getStatusMeta(order.status);

  return (
    <article className="border-border rounded-lg border bg-white p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:p-7">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.7fr_0.55fr_1fr_1fr_190px] xl:items-center">
        <div>
          <p className="text-text-secondary text-sm">N° заказа</p>
          <p className="text-text-primary mt-3 text-xl font-bold break-words">
            {order.order_number}
          </p>
          <p className="text-text-secondary mt-3 text-sm">{formatDateTime(order.created_at)}</p>
        </div>

        <div>
          <p className="text-text-secondary text-sm">Статус</p>
          <span
            className={cn(
              "mt-3 inline-flex rounded-lg px-4 py-2 text-sm font-bold",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>

        <div>
          <p className="text-text-secondary text-sm">Сумма</p>
          <p className="text-text-primary mt-3 text-xl font-bold">
            {toPriceFormat(order.final_price)}
          </p>
        </div>

        <div>
          <p className="text-text-secondary text-sm">Способ получения</p>
          <div className="mt-3 flex items-start gap-3">
            <DeliveryIcon className="text-accent-primary mt-0.5 shrink-0" size={24} />
            <span>
              <span className="block text-sm font-semibold">
                {formatDeliveryType(order.delivery_type)}
              </span>
              <span className="text-text-secondary mt-2 block text-sm">
                {formatItemsCount(order.items_count)}
              </span>
            </span>
          </div>
        </div>

        <div>
          <p className="text-text-secondary text-sm">Способ оплаты</p>
          <div className="mt-3 flex items-start gap-3">
            <PaymentIcon className="text-accent-primary mt-0.5 shrink-0" size={24} />
            <span>
              <span className="block text-sm font-semibold">
                {formatPaymentMethod(order.payment_method)}
              </span>
              <span className="text-text-secondary mt-2 block text-sm">
                {formatPaymentStatus(order.payment_status)}
              </span>
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Link
            className="border-border bg-bg-primary text-text-primary hover:bg-bg-hover inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-bold transition"
            href={ROUTES.PROFILE_ORDER(order.id)}
          >
            Подробнее
            <ChevronRight size={18} />
          </Link>
          <Button
            className="border-accent-primary text-accent-primary hover:bg-bg-hover gap-2 bg-white"
            variant="secondary"
            disabled={isPending}
            onClick={() => onRepeat(order)}
          >
            <RefreshCcw size={18} />
            {isPending ? "Повторяем..." : "Повторить заказ"}
          </Button>
        </div>
      </div>
      <OrderStatusStepper status={order.status} />
    </article>
  );
};

interface StatusPanelProps {
  text: string;
  tone: "error" | "success";
}

const StatusPanel = ({ text, tone }: StatusPanelProps) => {
  return (
    <div
      className={cn(
        "mb-5 rounded-lg border px-5 py-4 text-sm font-bold",
        tone === "error" && "text-error border-red-100 bg-red-50",
        tone === "success" && "bg-bg-hover text-accent-primary border-green-100",
      )}
    >
      {text}
    </div>
  );
};

const EmptyOrders = () => {
  return (
    <section className="border-border rounded-lg border bg-white p-8 text-center shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <span className="bg-bg-hover text-accent-primary mx-auto grid size-16 place-items-center rounded-full">
        <PackageCheck size={34} />
      </span>
      <h2 className="text-text-primary mt-5 text-2xl font-bold">Заказов не найдено</h2>
      <p className="text-text-secondary mx-auto mt-3 max-w-xl leading-7">
        Попробуйте выбрать другой статус или оформите новый заказ из каталога.
      </p>
      <Link
        className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-7 inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition"
        href={ROUTES.CATALOG}
      >
        Перейти в каталог
      </Link>
    </section>
  );
};

const getAccessToken = (): string | null => {
  return (
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token")
  );
};

const matchesFilter = (status: string, filter: OrderFilter): boolean => {
  const normalizedStatus = status.toLowerCase();

  if (filter === "all") {
    return true;
  }

  if (filter === "new") {
    return ["new", "created", "pending"].includes(normalizedStatus);
  }

  if (filter === "processing") {
    return ["processing", "assembling", "confirmed", "in_delivery"].includes(normalizedStatus);
  }

  if (filter === "completed") {
    return ["delivered", "completed", "done"].includes(normalizedStatus);
  }

  return ["cancelled", "canceled"].includes(normalizedStatus);
};

const getStatusMeta = (status: string): { className: string; label: string } => {
  const normalizedStatus = status.toLowerCase();

  if (["delivered", "completed", "done"].includes(normalizedStatus)) {
    return {
      className: "bg-green-100 text-accent-primary",
      label: "Доставлен",
    };
  }

  if (["processing", "assembling", "confirmed", "in_delivery"].includes(normalizedStatus)) {
    return {
      className: "bg-blue-100 text-blue-700",
      label: "В обработке",
    };
  }

  if (["cancelled", "canceled"].includes(normalizedStatus)) {
    return {
      className: "bg-bg-secondary text-text-secondary",
      label: "Отменен",
    };
  }

  return {
    className: "bg-yellow-100 text-yellow-700",
    label: "Новый",
  };
};

const formatDeliveryType = (deliveryType?: string | null): string => {
  return deliveryType === "pickup" ? "Самовывоз" : "Доставка курьером";
};

const formatPaymentMethod = (paymentMethod?: string | null): string => {
  if (paymentMethod === "cash" || paymentMethod === "on_delivery") {
    return "Наличными";
  }

  return "Банковской картой";
};

const formatPaymentStatus = (paymentStatus?: string | null): string => {
  if (paymentStatus === "paid" || paymentStatus === "success") {
    return "Онлайн";
  }

  if (paymentStatus === "failed" || paymentStatus === "cancelled") {
    return "Не оплачен";
  }

  return "При получении";
};

const formatItemsCount = (itemsCount?: number): string => {
  if (!itemsCount) {
    return "Состав заказа";
  }

  return `${itemsCount} ${getPlural(itemsCount, ["позиция", "позиции", "позиций"])}`;
};

const getPlural = (value: number, variants: [string, string, string]): string => {
  const absoluteValue = Math.abs(value);
  const lastDigit = absoluteValue % 10;
  const lastTwoDigits = absoluteValue % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return variants[2];
  }

  if (lastDigit === 1) {
    return variants[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return variants[1];
  }

  return variants[2];
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
