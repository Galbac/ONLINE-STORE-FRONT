"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CreditCard,
  Headphones,
  Info,
  Percent,
  RefreshCcw,
  Store,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import {
  orderApi,
  type OrderDetailResponse,
  type OrderItemResponse,
  type OrderStatusResponse,
} from "@/entities/order";
import { paymentApi, type PaymentDetailResponse } from "@/entities/payment";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Button, Container } from "@/shared/ui";

interface ProfileOrderDetailsViewProps {
  initialOrder: OrderDetailResponse;
  initialPayment: PaymentDetailResponse | null;
  initialStatus: OrderStatusResponse;
}

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

export const ProfileOrderDetailsView = ({
  initialOrder,
  initialPayment,
  initialStatus,
}: ProfileOrderDetailsViewProps) => {
  const [order, setOrder] = useState<OrderDetailResponse>(initialOrder);
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse>(initialStatus);
  const [payment, setPayment] = useState<PaymentDetailResponse | null>(initialPayment);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "cancel-order" | "cancel-payment" | "repeat" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const statusMeta = getStatusMeta(orderStatus.status || order.status);
  const paymentStatus = payment?.status ?? order.payment_status ?? order.payment?.status ?? null;
  const canCancelOrder = isOrderCancelable(orderStatus.status || order.status);
  const canCancelPayment = payment ? isPaymentCancelable(payment.status) : false;

  const handleRepeatOrder = (): void => {
    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingAction("repeat");
        setErrorMessage(null);
        const response = await orderApi.repeat(order.id, { replace_cart: false }, accessToken);
        const warningText =
          response.warnings.length > 0
            ? ` Добавлено с предупреждениями: ${response.warnings.length}.`
            : "";

        setMessage(`${response.message}${warningText}`);
      } catch {
        setMessage(null);
        setErrorMessage("Не удалось повторить заказ. Возможно, товары недоступны.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleCancelOrder = (): void => {
    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingAction("cancel-order");
        setErrorMessage(null);
        const response = await orderApi.cancel(
          order.id,
          { reason: "Отмена покупателем из личного кабинета" },
          accessToken,
        );
        const nextStatus = response.order.status;

        setOrder((currentOrder) => ({
          ...currentOrder,
          payment_status: response.order.payment_status ?? currentOrder.payment_status ?? null,
          status: nextStatus,
          updated_at: response.order.cancelled_at ?? currentOrder.updated_at,
        }));
        setOrderStatus((currentStatus) => ({
          ...currentStatus,
          payment_status: response.order.payment_status ?? currentStatus.payment_status ?? null,
          status: nextStatus,
          status_label: getStatusMeta(nextStatus).label,
          updated_at: response.order.cancelled_at ?? currentStatus.updated_at,
        }));
        setMessage(response.message);
      } catch {
        setMessage(null);
        setErrorMessage("Не удалось отменить заказ. Возможно, статус уже изменился.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleCancelPayment = (): void => {
    if (!payment) {
      return;
    }

    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingAction("cancel-payment");
        setErrorMessage(null);
        const response = await paymentApi.cancel(
          payment.id,
          {
            reason: "Отмена покупателем из личного кабинета",
          },
          accessToken,
        );

        setPayment((currentPayment) =>
          currentPayment
            ? {
                ...currentPayment,
                status: response.payment.status,
                updated_at: response.payment.cancelled_at ?? currentPayment.updated_at,
              }
            : currentPayment,
        );
        setMessage(response.message);
      } catch {
        setMessage(null);
        setErrorMessage("Не удалось отменить платеж. Проверьте статус оплаты позже.");
      } finally {
        setPendingAction(null);
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
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE_ORDERS}>
            Заказы
          </Link>
          <span>/</span>
          <span>Заказ {order.order_number}</span>
        </nav>

        <section className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-text-primary text-3xl font-bold break-words md:text-5xl">
              Заказ N°{order.order_number}
            </h1>
            <p className="text-text-secondary mt-4">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button
              className="gap-2"
              disabled={isPending}
              variant="secondary"
              onClick={handleRepeatOrder}
            >
              <RefreshCcw size={18} />
              {pendingAction === "repeat" ? "Повторяем..." : "Повторить заказ"}
            </Button>
            {canCancelOrder ? (
              <Button
                className="gap-2 border-red-200 bg-white text-red-600 hover:bg-red-50"
                disabled={isPending}
                variant="secondary"
                onClick={handleCancelOrder}
              >
                <Trash2 size={18} />
                {pendingAction === "cancel-order" ? "Отменяем..." : "Отменить заказ"}
              </Button>
            ) : null}
          </div>
        </section>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <span
            className={cn(
              "inline-flex rounded-lg px-4 py-2 text-sm font-bold",
              statusMeta.className,
            )}
          >
            {orderStatus.status_label || statusMeta.label}
          </span>
          <span className="text-text-secondary text-sm">
            Обновлен {formatDateTime(orderStatus.updated_at || order.updated_at)}
          </span>
        </div>

        {errorMessage ? (
          <StatusPanel text={errorMessage} tone="error" />
        ) : message ? (
          <StatusPanel text={message} tone="success" />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <section className="border-border rounded-lg border bg-white shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
            <div className="border-border border-b p-5 md:p-7">
              <h2 className="text-text-primary text-xl font-bold">Товары</h2>
            </div>
            <div className="divide-border divide-y">
              {order.items.length > 0 ? (
                order.items.map((item) => (
                  <OrderItemRow item={item} key={item.id ?? item.product_id} />
                ))
              ) : (
                <div className="text-text-secondary p-7 text-sm">
                  Состав заказа не передан backend.
                </div>
              )}
            </div>
            <OrderSummary order={order} />
          </section>

          <aside className="space-y-5">
            <InfoCard icon={Tag} title="Промокод">
              {Number(order.promo_discount_amount) > 0 ? (
                <DetailRow
                  label="Скидка по промокоду"
                  tone="success"
                  value={`-${toPriceFormat(order.promo_discount_amount)}`}
                />
              ) : (
                <p className="text-text-secondary text-sm">Промокод не применялся</p>
              )}
            </InfoCard>

            <InfoCard icon={order.delivery_type === "pickup" ? Store : Truck} title="Доставка">
              <div className="space-y-3">
                <p className="text-text-primary font-semibold">
                  {formatDeliveryType(order.delivery_type)}
                </p>
                <p className="text-text-secondary text-sm leading-6">{formatDestination(order)}</p>
                {order.comment ? (
                  <p className="text-text-secondary text-sm leading-6">{order.comment}</p>
                ) : null}
                <p className="text-text-primary font-bold">{toPriceFormat(order.delivery_price)}</p>
              </div>
            </InfoCard>

            <InfoCard icon={CreditCard} title="Оплата">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="text-text-primary block font-semibold">
                      {formatPaymentMethod(order.payment_method)}
                    </span>
                    <span className="text-text-secondary mt-2 block text-sm">
                      {formatPaymentStatus(paymentStatus)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs font-bold",
                      getPaymentStatusClass(paymentStatus),
                    )}
                  >
                    {formatPaymentStatus(paymentStatus)}
                  </span>
                </div>

                <div className="border-border space-y-3 border-t pt-4">
                  <DetailRow label="Сумма заказа" value={toPriceFormat(order.subtotal)} />
                  <DetailRow
                    label="Скидки"
                    tone="danger"
                    value={`-${toPriceFormat(getTotalDiscount(order))}`}
                  />
                  <DetailRow label="Доставка" value={toPriceFormat(order.delivery_price)} />
                  <DetailRow
                    label="Итого оплачено"
                    strong
                    value={toPriceFormat(order.final_price)}
                  />
                </div>

                {payment ? (
                  <div className="border-border space-y-3 border-t pt-4">
                    <p className="text-text-primary font-bold">Платеж</p>
                    <DetailRow label="N° платежа" value={`PAY-${payment.id}`} />
                    <DetailRow label="Провайдер" value={formatPaymentProvider(payment.provider)} />
                    <DetailRow
                      label={payment.paid_at ? "Дата оплаты" : "Дата создания"}
                      value={formatDateTime(payment.paid_at ?? payment.created_at)}
                    />
                    {canCancelPayment ? (
                      <Button
                        className="mt-2 w-full gap-2 border-red-200 bg-white text-red-600 hover:bg-red-50"
                        disabled={isPending}
                        variant="secondary"
                        onClick={handleCancelPayment}
                      >
                        <Trash2 size={18} />
                        {pendingAction === "cancel-payment" ? "Отменяем..." : "Отменить платеж"}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </InfoCard>
          </aside>
        </div>

        <section className="border-success/20 bg-bg-secondary mt-8 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex gap-4">
            <span className="bg-accent-primary text-accent-contrast grid size-12 shrink-0 place-items-center rounded-full">
              <Info size={26} />
            </span>
            <div>
              <p className="text-text-primary font-bold">Нужна помощь с заказом?</p>
              <p className="text-text-secondary mt-2 text-sm leading-6">
                Если у вас возникли вопросы по заказу, свяжитесь с нашей службой поддержки.
              </p>
            </div>
          </div>
          <Button className="w-full sm:w-auto" variant="secondary">
            Связаться с поддержкой
          </Button>
        </section>

        <section className="border-border mt-8 grid gap-5 rounded-lg border bg-white p-6 shadow-[0_10px_28px_rgb(20_28_18/0.04)] md:grid-cols-2 lg:grid-cols-4">
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

interface OrderItemRowProps {
  item: OrderItemResponse;
}

const OrderItemRow = ({ item }: OrderItemRowProps) => {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[64px_1fr_auto] sm:items-center md:p-7">
      <Link
        className="bg-bg-hover text-accent-primary grid size-16 place-items-center rounded-lg font-bold"
        href={ROUTES.PRODUCT(item.product_slug)}
      >
        {getProductMark(item.product_name)}
      </Link>
      <div>
        <Link
          className="text-text-primary hover:text-accent-primary font-bold"
          href={ROUTES.PRODUCT(item.product_slug)}
        >
          {item.product_name}
        </Link>
        <p className="text-text-secondary mt-2 text-sm">{formatUnit(item)}</p>
      </div>
      <div className="grid grid-cols-2 items-center gap-5 sm:min-w-56">
        <span className="text-text-secondary text-sm">
          {formatQuantity(item.quantity)} x {toPriceFormat(item.price)}
        </span>
        <span className="text-text-primary text-right text-lg font-bold">
          {toPriceFormat(item.final_price)}
        </span>
      </div>
    </div>
  );
};

interface OrderSummaryProps {
  order: OrderDetailResponse;
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  return (
    <div className="border-border border-t p-5 md:p-7">
      <div className="space-y-4">
        <DetailRow label={`Товары (${order.items.length})`} value={toPriceFormat(order.subtotal)} />
        <DetailRow
          label="Скидка"
          tone="danger"
          value={`-${toPriceFormat(order.discount_amount)}`}
        />
        <DetailRow
          label="Промокод"
          tone="success"
          value={
            Number(order.promo_discount_amount) > 0
              ? `-${toPriceFormat(order.promo_discount_amount)}`
              : "Не применен"
          }
        />
        <DetailRow label="Доставка" value={toPriceFormat(order.delivery_price)} />
      </div>
      <div className="border-border mt-5 flex items-center justify-between border-t pt-5">
        <span className="text-text-primary text-xl font-bold">Итого</span>
        <span className="text-text-primary text-2xl font-bold">
          {toPriceFormat(order.final_price)}
        </span>
      </div>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  strong?: boolean;
  tone?: "danger" | "success";
  value: string;
}

const DetailRow = ({ label, strong = false, tone, value }: DetailRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span
        className={cn(
          "text-right",
          strong ? "text-text-primary text-base font-bold" : "text-text-primary font-medium",
          tone === "danger" && "text-error",
          tone === "success" && "text-accent-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
};

interface InfoCardProps {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
}

const InfoCard = ({ children, icon: Icon, title }: InfoCardProps) => {
  return (
    <section className="border-border rounded-lg border bg-white p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:p-7">
      <div className="mb-5 flex items-center gap-4">
        <Icon className="text-accent-primary shrink-0" size={24} />
        <h2 className="text-text-primary text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
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

const getAccessToken = (): string | null => {
  return (
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token")
  );
};

const isOrderCancelable = (status: string): boolean => {
  return ["new", "created", "pending", "processing", "confirmed"].includes(status.toLowerCase());
};

const isPaymentCancelable = (status: string): boolean => {
  return ["new", "pending", "created", "processing"].includes(status.toLowerCase());
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

const getPaymentStatusClass = (status?: string | null): string => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === "paid" || normalizedStatus === "success") {
    return "bg-green-100 text-accent-primary";
  }

  if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
    return "bg-red-50 text-error";
  }

  return "bg-yellow-100 text-yellow-700";
};

const getProductMark = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const getTotalDiscount = (order: OrderDetailResponse): number => {
  return Number(order.discount_amount) + Number(order.promo_discount_amount);
};

const formatDestination = (order: OrderDetailResponse): string => {
  if (order.delivery_type === "pickup") {
    return order.pickup_point ? order.pickup_point.name : "Точка самовывоза не передана";
  }

  if (!order.address) {
    return "Адрес доставки не передан";
  }

  const apartment = order.address.apartment ? `, кв. ${order.address.apartment}` : "";
  const comment = order.address.comment ? `. ${order.address.comment}` : "";

  return `${order.address.city}, ул. ${order.address.street}, д. ${order.address.house}${apartment}${comment}`;
};

const formatDeliveryType = (deliveryType: string): string => {
  return deliveryType === "pickup" ? "Самовывоз" : "Доставка курьером";
};

const formatPaymentMethod = (paymentMethod?: string | null): string => {
  if (paymentMethod === "cash" || paymentMethod === "on_delivery") {
    return "Оплата при получении";
  }

  return "Банковской картой онлайн";
};

const formatPaymentProvider = (provider: string): string => {
  if (provider === "online" || provider === "card") {
    return "Онлайн-эквайринг";
  }

  return provider;
};

const formatPaymentStatus = (paymentStatus?: string | null): string => {
  if (paymentStatus === "paid" || paymentStatus === "success") {
    return "Оплачено";
  }

  if (paymentStatus === "failed") {
    return "Ошибка оплаты";
  }

  if (paymentStatus === "cancelled" || paymentStatus === "canceled") {
    return "Отменено";
  }

  return "Ожидает оплаты";
};

const formatQuantity = (value: string): string => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return value;
  }

  return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(2);
};

const formatUnit = (item: OrderItemResponse): string => {
  return item.product_type === "weighted"
    ? item.unit
    : `${formatQuantity(item.quantity)} ${item.unit}`;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
