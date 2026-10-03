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
import { authApi } from "@/entities/auth";
import { orderApi, type OrderShortResponse } from "@/entities/order";
import { isApiErrorStatus, extractErrorMessage } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { toPriceFormat, formatPaymentStatus } from "@/shared/lib/format";
import {
  clearStoredAuth,
  Container,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from "@/shared/ui";
import { CancelOrderModal } from "./CancelOrderModal";

interface ProfileOrdersViewProps {
  initialOrders: {
    items: OrderShortResponse[];
  };
}

type OrderFilter = "all" | "pending_payment" | "new" | "processing" | "completed" | "cancelled";

interface FilterOption {
  label: string;
  value: OrderFilter;
}

const filterOptions: FilterOption[] = [
  { label: "Все заказы", value: "all" },
  { label: "К оплате", value: "pending_payment" },
  { label: "Новые", value: "new" },
  { label: "В обработке", value: "processing" },
  { label: "Выполненные", value: "completed" },
  { label: "Отмененные", value: "cancelled" },
];

export const ProfileOrdersView = ({ initialOrders }: ProfileOrdersViewProps) => {
  const [orders, setOrders] = useState<OrderShortResponse[]>(initialOrders.items);
  const [isLoading, setIsLoading] = useState<boolean>(initialOrders.items.length === 0);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("all");
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [datePeriod, setDatePeriod] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderShortResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async (): Promise<void> => {
      let accessToken = getStoredAccessToken();

      // Автоматическое обновление токена, если access_token истек
      if (!accessToken) {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          try {
            const refreshRes = await authApi.refresh({ refresh_token: refreshToken });
            if (refreshRes.access_token) {
              storeAuthTokens({
                accessToken: refreshRes.access_token,
                refreshToken: refreshRes.refresh_token,
              });
              accessToken = refreshRes.access_token;
            }
          } catch {
            // refresh не удался
          }
        }
      }

      if (!accessToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await orderApi.getProfileOrders({ offset: 0, limit: 100 }, accessToken);

        if (isMounted) {
          setOrders(response.items);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        // При 401 пробуем повторить через refresh token
        if (isApiErrorStatus(err, 401)) {
          const refreshToken = getStoredRefreshToken();
          if (refreshToken) {
            try {
              const refreshRes = await authApi.refresh({ refresh_token: refreshToken });
              if (refreshRes.access_token) {
                storeAuthTokens({
                  accessToken: refreshRes.access_token,
                  refreshToken: refreshRes.refresh_token,
                });
                const retryResponse = await orderApi.getProfileOrders(
                  { offset: 0, limit: 100 },
                  refreshRes.access_token,
                );
                if (isMounted) {
                  setOrders(retryResponse.items);
                  setIsLoading(false);
                  return;
                }
              }
            } catch {
              clearStoredAuth();
            }
          }
        }

        if (isMounted) {
          setErrorMessage(extractErrorMessage(err, "Не удалось загрузить заказы."));
          setIsLoading(false);
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
      pending_payment: orders.filter((o) => matchesFilter(o.status, "pending_payment")).length,
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
    const accessToken = getStoredAccessToken();

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
      } catch (err: unknown) {
        setStatusMessage(null);
        setErrorMessage(
          extractErrorMessage(err, "Не удалось повторить заказ. Возможно, товары недоступны."),
        );
      } finally {
        setPendingOrderId(null);
      }
    });
  };

  const handleCancelOrder = (order: OrderShortResponse): void => {
    if (!canCustomerCancelOrder(order)) return;
    setOrderToCancel(order);
  };

  const confirmCancelOrder = (): void => {
    if (!orderToCancel) return;
    const order = orderToCancel;
    startTransition(async () => {
      try {
        setPendingOrderId(order.id);
        setErrorMessage(null);
        setStatusMessage(null);
        const response = await orderApi.cancel(
          order.id,
          { reason: "Отмена покупателем из личного кабинета" },
          getStoredAccessToken(),
        );
        setOrders((currentOrders) =>
          currentOrders.map((currentOrder) =>
            currentOrder.id === order.id
              ? { ...currentOrder, status: response.order.status }
              : currentOrder,
          ),
        );
        setStatusMessage(response.message);
        setOrderToCancel(null);
      } catch (err: unknown) {
        setErrorMessage(
          extractErrorMessage(
            err,
            "Не удалось отменить заказ. Возможно, его статус уже изменился.",
          ),
        );
        setOrderToCancel(null);
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
        <div className="mb-5 flex [scrollbar-width:none] gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((option) => {
            const count = counts[option.value];
            const isActive = activeFilter === option.value;
            const isPendingPaymentTab = option.value === "pending_payment";
            return (
              <button
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all",
                  isActive
                    ? isPendingPaymentTab
                      ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
                      : "bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
                    : isPendingPaymentTab && count > 0
                      ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
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
                    isActive
                      ? "bg-white/20 text-white"
                      : isPendingPaymentTab && count > 0
                        ? "bg-amber-200 text-amber-900"
                        : "bg-slate-200 text-slate-700",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Сгруппированный flex-тулбар: Поиск с кнопкой очистки и выбор периода */}
        <div className="mb-8 flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Поиск по номеру заказа (#123)..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-10 text-xs font-semibold text-slate-800 shadow-2xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
            {searchNumber ? (
              <button
                type="button"
                onClick={() => setSearchNumber("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-0.5 text-slate-400 hover:text-slate-600"
                title="Очистить поиск"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-semibold whitespace-nowrap text-slate-500">Период:</span>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-emerald-500"
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

        {/* 3. Список заказов, скелетоны загрузки или разделенные Empty States */}
        <section className="space-y-5">
          {isLoading ? (
            <OrdersLoadingSkeleton />
          ) : visibleOrders.length > 0 ? (
            visibleOrders.map((order) => (
              <OrderCard
                isPending={isPending && pendingOrderId === order.id}
                key={order.id}
                order={order}
                onCancel={handleCancelOrder}
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
              <p className="text-xs font-bold text-slate-800">
                Не нашли нужный заказ или возникли вопросы?
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Наша служба заботы о клиентах всегда на связи и готова оперативно помочь
              </p>
            </div>
          </div>
          <Link
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100 px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-200 active:scale-95"
            href={ROUTES.FEEDBACK}
          >
            <span>Связаться с поддержкой</span>
          </Link>
        </div>
        {orderToCancel ? (
          <CancelOrderModal
            orderNumber={orderToCancel.order_number}
            isPending={isPending && pendingOrderId === orderToCancel.id}
            onClose={() => setOrderToCancel(null)}
            onConfirm={confirmCancelOrder}
          />
        ) : null}
      </Container>
    </main>
  );
};

const OrdersLoadingSkeleton = () => {
  return (
    <div className="animate-pulse space-y-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-2">
              <div className="h-5 w-32 rounded-lg bg-slate-200" />
              <div className="h-3 w-40 rounded-md bg-slate-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-7 w-28 rounded-xl bg-slate-200" />
              <div className="h-7 w-24 rounded-lg bg-slate-200" />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface OrderCardProps {
  isPending: boolean;
  onCancel: (order: OrderShortResponse) => void;
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

const OrderStatusStepper = ({ order }: { order: OrderShortResponse }) => {
  const normalized = order.status.toLowerCase();
  const isCancelled = normalized === "cancelled" || normalized === "canceled";

  if (normalized === "pending_payment") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-t border-amber-200/80 border-slate-100 bg-amber-50/80 px-3.5 py-2.5 pt-3 text-xs text-amber-900">
        <span className="flex items-center gap-1.5 font-bold">
          <CreditCard size={15} className="shrink-0 text-amber-600" />
          Заказ ожидает оплаты онлайн
        </span>
        <Link
          href={ROUTES.PROFILE_ORDER(order.id)}
          className="inline-flex items-center gap-1 font-extrabold text-amber-700 hover:text-amber-900 hover:underline"
        >
          <span>Оплатить заказ</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700">
        Заказ отменен
      </div>
    );
  }

  const currentIdx = getStatusStepIndex(order.status);

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="relative flex items-center justify-between">
        <div className="absolute top-1/2 right-3 left-3 -z-0 h-0.5 -translate-y-1/2 bg-slate-200" />
        <div
          className="absolute top-1/2 left-3 -z-0 h-0.5 -translate-y-1/2 bg-emerald-600 transition-all duration-300"
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
                    : "border-2 border-slate-200 bg-white text-slate-400",
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
        <span className="font-medium text-slate-500">
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

const OrderCard = ({ isPending, onCancel, onRepeat, order }: OrderCardProps) => {
  const DeliveryIcon = order.delivery_type === "pickup" ? Store : Truck;
  const PaymentIcon =
    order.payment_method === "cash" || order.payment_method === "on_delivery"
      ? Banknote
      : CreditCard;
  const status = getStatusMeta(order.status);
  const isPendingPayment = order.status === "pending_payment";

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 md:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.7fr_0.55fr_1fr_1fr_190px] xl:items-center">
        <div>
          <p className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
            № заказа
          </p>
          <p className="text-text-primary mt-1.5 text-lg font-black break-words">
            {order.order_number}
          </p>
          <time className="mt-1.5 block text-xs text-slate-400" suppressHydrationWarning>
            {formatDateTime(order.created_at)}
          </time>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
            Статус
          </p>
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
          <p className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
            Сумма
          </p>
          <p className="mt-1.5 text-lg font-black text-slate-900">
            {toPriceFormat(order.final_price)}
          </p>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
            Получение
          </p>
          <div className="mt-2 flex items-start gap-2.5">
            <DeliveryIcon className="mt-0.5 shrink-0 text-emerald-600" size={18} />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {formatDeliveryType(order.delivery_type)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{formatItemsCount(order.items_count)}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
            Оплата
          </p>
          <div className="mt-2 flex items-start gap-2.5">
            <PaymentIcon className="mt-0.5 shrink-0 text-emerald-600" size={18} />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {formatPaymentMethod(order.payment_method)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatPaymentStatus(order.payment_status)}
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {isPendingPayment ? (
            <Link
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 active:scale-95"
              href={ROUTES.PROFILE_ORDER(order.id)}
            >
              <CreditCard size={14} />
              <span>Оплатить заказ</span>
            </Link>
          ) : (
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"
              disabled={isPending}
              onClick={() => onRepeat(order)}
            >
              <RefreshCcw size={14} className={isPending ? "animate-spin" : ""} />
              <span>{isPending ? "Повторяем..." : "Повторить заказ"}</span>
            </button>
          )}
          {canCustomerCancelOrder(order) ? (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-50 disabled:opacity-60"
              disabled={isPending}
              onClick={() => onCancel(order)}
            >
              <X size={14} />
              {isPending ? "Отменяем..." : "Отменить заказ"}
            </button>
          ) : null}
          <Link
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100 px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-200 active:scale-95"
            href={ROUTES.PROFILE_ORDER(order.id)}
          >
            <span>Подробнее</span>
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
      <OrderStatusStepper order={order} />
    </article>
  );
};

const canCustomerCancelOrder = (order: OrderShortResponse): boolean => {
  const allowedStatuses = ["new", "pending_payment", "confirmed", "awaiting_confirmation"];
  const unpaidStatuses = ["paid", "succeeded", "success"];
  return (
    allowedStatuses.includes(order.status.toLowerCase()) &&
    !unpaidStatuses.includes((order.payment_status ?? "").toLowerCase())
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
        tone === "error" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
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
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-500">
        Свежие фермерские продукты, натуральное мясо Халяль и отборные овощи ждут вас в нашем
        каталоге.
      </p>

      {/* Промокод на первый заказ */}
      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-900 shadow-2xs">
        <Sparkles size={16} className="shrink-0 text-emerald-700" />
        <span>
          Промокод на первый заказ:{" "}
          <strong className="font-black tracking-wider text-emerald-800">ПЕРВЫЙ</strong> (-10% от 1
          000 ₽)
        </span>
      </div>

      <div className="mt-7">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-95"
          href={ROUTES.CATALOG}
        >
          Перейти в каталог
        </Link>
      </div>
    </section>
  );
};

/**
 * 2. Empty State для случая, когда заказы есть, но фильтр вернул 0
 */
interface EmptyOrdersFilteredProps {
  onReset: () => void;
}

const EmptyOrdersFiltered = ({ onReset }: EmptyOrdersFilteredProps) => {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-2xs">
        <SearchX size={30} />
      </span>
      <h2 className="mt-5 text-xl font-bold text-slate-900">Заказы не найдены</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
        В выбранном статусе или за указанный период заказов не обнаружено. Измените параметры поиска
        или сбросьте фильтры.
      </p>
      <div className="mt-7">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-slate-100 px-6 text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-200 active:scale-95"
        >
          <RotateCcw size={16} />
          <span>Сбросить фильтры</span>
        </button>
      </div>
    </section>
  );
};

const matchesFilter = (status: string, filter: OrderFilter): boolean => {
  const normalizedStatus = status.toLowerCase();

  if (filter === "all") {
    return true;
  }

  if (filter === "pending_payment") {
    return normalizedStatus === "pending_payment";
  }

  if (filter === "new") {
    return ["new", "created", "pending", "pending_payment"].includes(normalizedStatus);
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

  if (normalizedStatus === "pending_payment") {
    return {
      className: "bg-amber-100 text-amber-900 border border-amber-300",
      label: "Ожидает оплаты",
    };
  }

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
