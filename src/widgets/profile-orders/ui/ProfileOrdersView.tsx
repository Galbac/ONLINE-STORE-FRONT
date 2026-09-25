"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Banknote,
  ChevronRight,
  CreditCard,
  Headphones,
  RefreshCcw,
  RotateCcw,
  Search,
  SearchX,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  X,
} from "lucide-react";
import { orderApi, type OrderShortResponse } from "@/entities/order";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { Container } from "@/shared/ui";

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

  // Динамические счетчики для каждого таба
  const counts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => matchesFilter(o.status, "new")).length,
      processing: orders.filter((o) => matchesFilter(o.status, "processing")).length,
      completed: orders.filter((o) => matchesFilter(o.status, "completed")).length,
      cancelled: orders.filter((o) => matchesFilter(o.status, "cancelled")).length,
    };
  }, [orders]);

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

  const handleResetFilters = (): void => {
    setActiveFilter("all");
    setSearchNumber("");
    setDatePeriod("all");
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        {/* Хлебные крошки: Мои заказы */}
        <nav className="text-text-secondary mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary transition-colors" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary transition-colors" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Мои заказы</span>
        </nav>

        <section className="mb-8">
          <h1 className="text-text-primary text-3xl font-black tracking-tight md:text-4xl">
            Мои заказы
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            История покупок, отслеживание курьера и повтор заказов
          </p>
        </section>

        {/* 1. Табы статусов располагаются НАД строкой поиска */}
        <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((option) => {
            const count = counts[option.value];
            const isActive = activeFilter === option.value;
            return (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                )}
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    isActive ? "bg-emerald-600/90 text-white" : "bg-slate-200 text-slate-700",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Сгруппированный flex-тулбар: Поиск с кнопкой очистки и выбор периода */}
        <div className="mb-8 flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Поиск по номеру заказа (#123)..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
            {searchNumber ? (
              <button
                type="button"
                onClick={() => setSearchNumber("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                aria-label="Очистить поиск"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Период:</span>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">За всё время</option>
              <option value="month">За последний месяц</option>
              <option value="3months">За 3 месяца</option>
              <option value="year">За последний год</option>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <StatusPanel tone="error" text={errorMessage} />
        ) : statusMessage ? (
          <StatusPanel tone="success" text={statusMessage} />
        ) : null}

        {/* 3. Список заказов или разделенные Empty States */}
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
          ) : orders.length === 0 ? (
            <EmptyOrdersFirstTime />
          ) : (
            <EmptyOrdersFiltered onReset={handleResetFilters} />
          )}
        </section>

        {/* 4. Компактный сервисный inline-блок поддержки */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Headphones size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">Не нашли нужный заказ или возникли вопросы?</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Наша служба заботы о клиентах всегда на связи и готова оперативно помочь
              </p>
            </div>
          </div>
          <Link
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200/80 px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-200 active:scale-95 transition"
            href={ROUTES.FEEDBACK}
          >
            <span>Связаться с поддержкой</span>
          </Link>
        </div>
      </Container>
    </main>
  );
};

interface OrderCardProps {
  isPending: boolean;
  onRepeat: (order: OrderShortResponse) => void;
  order: OrderShortResponse;
}

const ORDER_STATUS_STEPS = [
  { key: "new", label: "Принят" },
  { key: "confirmed", label: "Подтвержден" },
  { key: "assembling", label: "Сборка" },
  { key: "in_delivery", label: "В пути" },
  { key: "delivered", label: "Доставлен" },
] as const;

const getStatusStepIndex = (status: string): number => {
  const normalized = status.toLowerCase();
  if (normalized === "delivered" || normalized === "completed" || normalized === "done") return 4;
  if (normalized === "in_delivery") return 3;
  if (normalized === "assembling" || normalized === "processing") return 2;
  if (normalized === "confirmed") return 1;
  return 0;
};

const OrderStatusStepper = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase();
  const isCancelled = normalized === "cancelled" || normalized === "canceled";

  if (isCancelled) {
    return (
      <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-700">
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
            ? "🚴 Курьер выехал: доставка ожидается в ближайшее время"
            : currentIdx >= 1
            ? "📦 Заказ собирается и проверяется на свежесть"
            : "⏳ Заказ принят магазином"}
        </span>
        <span className="font-bold text-emerald-700">
          {currentIdx < 4 ? `Шаг ${currentIdx + 1} из 5` : "Завершен"}
        </span>
      </div>
    </div>
  );
};

const OrderCard = ({ isPending, onRepeat, order }: OrderCardProps) => {
  const DeliveryIcon = order.delivery_type === "pickup" ? Store : Truck;
  const PaymentIcon = order.payment_method === "cash" || order.payment_method === "on_delivery" ? Banknote : CreditCard;
  const status = getStatusMeta(order.status);

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 md:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.7fr_0.55fr_1fr_1fr_190px] xl:items-center">
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">№ заказа</p>
          <p className="text-text-primary mt-1.5 text-lg font-black break-words">
            {order.order_number}
          </p>
          <time className="text-slate-400 mt-1.5 text-xs block" suppressHydrationWarning>
            {formatDateTime(order.created_at)}
          </time>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Статус</p>
          <span
            className={cn(
              "mt-2 inline-flex rounded-xl px-3 py-1 text-xs font-bold",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Сумма</p>
          <p className="text-slate-900 mt-1.5 text-lg font-black">
            {toPriceFormat(order.final_price)}
          </p>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Получение</p>
          <div className="mt-2 flex items-start gap-2.5">
            <DeliveryIcon className="text-emerald-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {formatDeliveryType(order.delivery_type)}
              </p>
              <p className="text-slate-400 mt-0.5 text-xs">
                {formatItemsCount(order.items_count)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Оплата</p>
          <div className="mt-2 flex items-start gap-2.5">
            <PaymentIcon className="text-emerald-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {formatPaymentMethod(order.payment_method)}
              </p>
              <p className="text-slate-400 mt-0.5 text-xs">
                {formatPaymentStatus(order.payment_status)}
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки приведены к дизайн-системе: основной акцент — изумрудный (#047857), вторичные — серый (#F3F4F6) */}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Link
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200/80 px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-200 active:scale-95 transition"
            href={ROUTES.PROFILE_ORDER(order.id)}
          >
            <span>Подробнее</span>
            <ChevronRight size={15} />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 active:scale-95 transition disabled:opacity-60 cursor-pointer"
            disabled={isPending}
            onClick={() => onRepeat(order)}
          >
            <RefreshCcw size={14} className={isPending ? "animate-spin" : ""} />
            <span>{isPending ? "Повторяем..." : "Повторить заказ"}</span>
          </button>
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
        "mb-5 rounded-2xl border px-4.5 py-3.5 text-xs font-bold shadow-2xs",
        tone === "error" && "text-rose-700 border-rose-200 bg-rose-50",
        tone === "success" && "text-emerald-800 border-emerald-200 bg-emerald-50",
      )}
    >
      {text}
    </div>
  );
};

/**
 * 1. Empty State для случая, когда у пользователя ВООБЩЕ нет заказов (total === 0)
 */
const EmptyOrdersFirstTime = () => {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto flex size-18 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
        <ShoppingBag size={34} />
      </span>
      <h2 className="mt-6 text-2xl font-bold text-slate-900">У вас пока нет заказов</h2>
      <p className="mx-auto mt-2.5 max-w-md text-sm text-slate-500 leading-relaxed">
        Свежие фермерские продукты, натуральное мясо Халяль и отборные овощи ждут вас в нашем каталоге.
      </p>

      {/* Промокод на первый заказ */}
      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-900 shadow-2xs">
        <Sparkles size={16} className="text-emerald-700 shrink-0" />
        <span>
          Промокод на первый заказ: <strong className="font-black text-emerald-800 tracking-wider">ПЕРВЫЙ</strong> (-10% от 1 000 ₽)
        </span>
      </div>

      <div className="mt-7">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-800 active:scale-95 transition"
          href={ROUTES.CATALOG}
        >
          Перейти в каталог
        </Link>
      </div>
    </section>
  );
};

/**
 * 2. Empty State для случая, когда поиск или фильтр вернул 0 результатов
 */
interface EmptyOrdersFilteredProps {
  onReset: () => void;
}

const EmptyOrdersFiltered = ({ onReset }: EmptyOrdersFilteredProps) => {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto flex size-18 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX size={34} />
      </span>
      <h2 className="mt-6 text-2xl font-bold text-slate-900">Ничего не найдено по вашему запросу</h2>
      <p className="mx-auto mt-2.5 max-w-md text-sm text-slate-500 leading-relaxed">
        В выбранном статусе или за указанный период заказов не обнаружено. Измените параметры поиска или сбросьте фильтры.
      </p>
      <div className="mt-7">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 text-sm font-bold text-slate-700 border border-slate-200/70 hover:bg-slate-200 shadow-2xs active:scale-95 transition cursor-pointer"
        >
          <RotateCcw size={16} />
          <span>Сбросить фильтры</span>
        </button>
      </div>
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
      className: "bg-emerald-100 text-emerald-800",
      label: "Доставлен",
    };
  }

  if (["processing", "assembling", "confirmed", "in_delivery"].includes(normalizedStatus)) {
    return {
      className: "bg-blue-100 text-blue-800",
      label: "В обработке",
    };
  }

  if (["cancelled", "canceled"].includes(normalizedStatus)) {
    return {
      className: "bg-slate-100 text-slate-600",
      label: "Отменен",
    };
  }

  return {
    className: "bg-amber-100 text-amber-800",
    label: "Новый",
  };
};

const formatDeliveryType = (deliveryType?: string | null): string => {
  return deliveryType === "pickup" ? "Самовывоз" : "Доставка курьером";
};

const formatPaymentMethod = (paymentMethod?: string | null): string => {
  if (paymentMethod === "cash" || paymentMethod === "on_delivery") {
    return "При получении";
  }

  return "Банковской картой";
};

const formatPaymentStatus = (paymentStatus?: string | null): string => {
  if (paymentStatus === "paid" || paymentStatus === "success") {
    return "Онлайн оплачен";
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
