"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Printer, RefreshCw, Save, X } from "lucide-react";
import { adminOrderApi, type AdminOrderDetailResponse } from "@/entities/admin-order";
import { paymentApi, type PaymentDetailResponse } from "@/entities/payment";
import { getStoredAdminAccessToken } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface AdminOrderDetailsViewProps {
  initialOrder: AdminOrderDetailResponse;
  initialPayment: PaymentDetailResponse | null;
}

type ActionName =
  | "cancel"
  | "comment"
  | "confirm"
  | "payment-cancel"
  | "print"
  | "refund"
  | "status"
  | "sync";

export const AdminOrderDetailsView = ({
  initialOrder,
  initialPayment,
}: AdminOrderDetailsViewProps) => {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [payment, setPayment] = useState(initialPayment);
  const [pendingAction, setPendingAction] = useState<ActionName | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (action: ActionName, handler: () => Promise<void>): Promise<void> => {
    setPendingAction(action);
    setError(null);
    setMessage(null);

    try {
      await handler();
      router.refresh();
    } catch {
      setError("Операция не выполнена. Проверьте данные или войдите заново.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdateComment = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void runAction("comment", async () => {
      await adminOrderApi.update(order.id, {
        comment: getNullableFormValue(formData, "comment"),
        internal_comment: getNullableFormValue(formData, "internal_comment"),
      });
      setOrder((currentOrder) => ({
        ...currentOrder,
        comment: getNullableFormValue(formData, "comment"),
      }));
      setMessage("Комментарии сохранены.");
    });
  };

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = getRequiredFormValue(formData, "status");

    if (!status) {
      setError("Укажите новый статус заказа.");
      return;
    }

    void runAction("status", async () => {
      const response = await adminOrderApi.updateStatus(order.id, {
        comment: getNullableFormValue(formData, "comment"),
        status,
      });
      setOrder((currentOrder) => ({
        ...currentOrder,
        status: response.status,
      }));
      setMessage("Статус заказа обновлен.");
    });
  };

  const handleConfirm = (): void => {
    void runAction("confirm", async () => {
      const response = await adminOrderApi.confirm(order.id);
      setOrder((currentOrder) => ({
        ...currentOrder,
        status: response.order.status,
      }));
      setMessage(response.message);
    });
  };

  const handleCancelOrder = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void runAction("cancel", async () => {
      const response = await adminOrderApi.cancel(order.id, {
        reason: getNullableFormValue(formData, "reason"),
      });
      setOrder((currentOrder) => ({
        ...currentOrder,
        cancel_reason: response.order.cancel_reason ?? getNullableFormValue(formData, "reason"),
        status: response.order.status,
      }));
      setMessage(response.message);
    });
  };

  const handleSync = (): void => {
    void runAction("sync", async () => {
      const response = await adminOrderApi.sync1C(order.id);
      setOrder((currentOrder) => ({
        ...currentOrder,
        external_1c_id: response.external_1c_id ?? null,
        last_sync_at: response.last_sync_at ?? null,
        sync_status: response.sync_status,
      }));
      setMessage("Синхронизация с 1С запущена.");
    });
  };

  const handlePrint = (): void => {
    void runAction("print", async () => {
      await adminOrderApi.getPrint(order.id);
      setMessage("Печатная версия запрошена.");
    });
  };

  const handlePaymentCancel = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const currentPayment = payment ?? order.payment;

    if (!currentPayment) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    void runAction("payment-cancel", async () => {
      const response = await paymentApi.cancel(
        currentPayment.id,
        {
          reason: getNullableFormValue(formData, "reason"),
        },
        getStoredAdminAccessToken(),
      );
      setPayment((current) =>
        current
          ? {
              ...current,
              status: response.payment.status,
              updated_at: response.payment.cancelled_at ?? current.updated_at,
            }
          : current,
      );
      setMessage(response.message);
    });
  };

  const handlePaymentRefund = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const currentPayment = payment ?? order.payment;

    if (!currentPayment) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    void runAction("refund", async () => {
      const response = await paymentApi.refund(
        currentPayment.id,
        {
          amount: getNullableFormValue(formData, "amount"),
          reason: getNullableFormValue(formData, "reason"),
        },
        getStoredAdminAccessToken(),
      );
      setMessage(response.message);
    });
  };

  const paymentSummary = payment ?? order.payment;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
            href={ROUTES.ADMIN_ORDERS}
          >
            <ArrowLeft size={16} />
            Заказы
          </Link>
          <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">
            {order.order_number}
          </h1>
          <p className="text-text-secondary mt-2">
            Создан {formatDate(order.created_at)} · ID {order.id}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="border-border hover:bg-bg-hover inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
            disabled={pendingAction === "print"}
            onClick={handlePrint}
            type="button"
          >
            <Printer size={17} />
            Печать
          </button>
          <button
            className="border-border hover:bg-bg-hover inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
            disabled={pendingAction === "sync"}
            onClick={handleSync}
            type="button"
          >
            <RefreshCw size={17} />
            Синхронизация 1С
          </button>
          <button
            className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
            disabled={pendingAction === "confirm"}
            onClick={handleConfirm}
            type="button"
          >
            <Check size={17} />
            Подтвердить
          </button>
        </div>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Статус заказа" value={order.status} />
        <SummaryCard
          label="Статус оплаты"
          value={order.payment_status ?? paymentSummary?.status ?? "-"}
        />
        <SummaryCard label="Сумма" value={toPriceFormat(order.final_price)} />
        <SummaryCard label="sync_status 1С" value={order.sync_status} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Клиент и контакты">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Имя" value={order.customer.name} />
              <DetailRow label="Телефон" value={order.customer.phone} />
              <DetailRow label="Email" value={order.customer.email ?? "-"} />
              <DetailRow label="ID клиента" value={String(order.customer.id)} />
            </div>
          </Card>

          <Card title="Товары">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="text-text-muted bg-bg-secondary text-xs uppercase">
                  <tr>
                    <TableHeader>Товар</TableHeader>
                    <TableHeader>Количество</TableHeader>
                    <TableHeader>Цена</TableHeader>
                    <TableHeader>Итого</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr className="border-border border-t" key={item.id}>
                      <TableCell>
                        <p className="text-text-primary font-bold">{item.product_name}</p>
                        <p className="text-text-muted mt-1 text-xs">
                          Product ID: {item.product_id}
                        </p>
                      </TableCell>
                      <TableCell>
                        {formatQuantity(item.quantity)} {item.unit}
                      </TableCell>
                      <TableCell>{toPriceFormat(item.price)}</TableCell>
                      <TableCell>{toPriceFormat(item.final_price)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Доставка или самовывоз">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Тип" value={order.delivery_type} />
              <DetailRow label="Стоимость" value={toPriceFormat(order.delivery_price)} />
              <DetailRow label="Адрес" value={formatDeliveryAddress(order)} />
              <DetailRow label="Пункт самовывоза" value={formatPickupPoint(order)} />
            </div>
          </Card>

          <Card title="История статусов">
            {order.status_history && order.status_history.length > 0 ? (
              <div className="space-y-3">
                {order.status_history.map((item) => (
                  <div
                    className="border-border rounded-lg border p-3"
                    key={`${item.status}-${item.created_at}`}
                  >
                    <p className="text-text-primary font-bold">{item.status}</p>
                    <p className="text-text-muted mt-1 text-sm">{formatDate(item.created_at)}</p>
                    {item.comment ? (
                      <p className="text-text-secondary mt-2 text-sm">{item.comment}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">История статусов пока пустая.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Суммы">
            <div className="space-y-3">
              <DetailRow label="Товары" value={toPriceFormat(order.subtotal)} />
              <DetailRow label="Скидка" value={toPriceFormat(order.discount_amount)} />
              <DetailRow label="Промокод" value={toPriceFormat(order.promo_discount_amount)} />
              <DetailRow label="Доставка" value={toPriceFormat(order.delivery_price)} />
              <div className="border-border border-t pt-3">
                <DetailRow label="Итого" value={toPriceFormat(order.final_price)} strong />
              </div>
            </div>
          </Card>

          <Card title="Комментарии">
            <form className="space-y-3" onSubmit={handleUpdateComment}>
              <Textarea
                defaultValue={order.comment ?? ""}
                label="Комментарий клиента"
                name="comment"
              />
              <Textarea label="Внутренний комментарий" name="internal_comment" />
              <SubmitButton disabled={pendingAction === "comment"} icon={<Save size={16} />}>
                Сохранить
              </SubmitButton>
            </form>
            {order.cancel_reason ? (
              <p className="text-error mt-4 text-sm">Причина отмены: {order.cancel_reason}</p>
            ) : null}
          </Card>

          <Card title="Статус заказа">
            <form className="space-y-3" onSubmit={handleStatusUpdate}>
              <Input defaultValue={order.status} label="Новый статус" name="status" required />
              <Textarea label="Комментарий к статусу" name="comment" />
              <SubmitButton disabled={pendingAction === "status"} icon={<Save size={16} />}>
                Сменить статус
              </SubmitButton>
            </form>
          </Card>

          <Card title="Отмена заказа">
            <form className="space-y-3" onSubmit={handleCancelOrder}>
              <Textarea label="Причина отмены" name="reason" />
              <SubmitButton
                tone="danger"
                disabled={pendingAction === "cancel"}
                icon={<X size={16} />}
              >
                Отменить заказ
              </SubmitButton>
            </form>
          </Card>

          <Card title="1С">
            <div className="space-y-3">
              <DetailRow label="sync_status" value={order.sync_status} />
              <DetailRow label="external_1c_id" value={order.external_1c_id ?? "-"} />
              <DetailRow label="Последняя синхронизация" value={formatDate(order.last_sync_at)} />
              <DetailRow label="Ошибка" value={order.sync_error ?? "-"} />
              <DetailRow label="Код ошибки" value={order.sync_error_code ?? "-"} />
            </div>
          </Card>

          <Card title="Оплата">
            {paymentSummary ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <DetailRow label="Payment ID" value={String(paymentSummary.id)} />
                  <DetailRow label="Статус" value={paymentSummary.status} />
                  <DetailRow label="Сумма" value={toPriceFormat(paymentSummary.amount)} />
                  <DetailRow label="Валюта" value={paymentSummary.currency} />
                  <DetailRow label="Провайдер" value={paymentSummary.provider ?? "-"} />
                  <DetailRow label="Оплачен" value={formatDate(paymentSummary.paid_at)} />
                </div>

                <form className="space-y-3" onSubmit={handlePaymentCancel}>
                  <Textarea label="Причина отмены оплаты" name="reason" />
                  <SubmitButton
                    tone="secondary"
                    disabled={pendingAction === "payment-cancel"}
                    icon={<X size={16} />}
                  >
                    Отменить оплату
                  </SubmitButton>
                </form>

                <form className="space-y-3" onSubmit={handlePaymentRefund}>
                  <Input label="Сумма возврата" name="amount" placeholder={paymentSummary.amount} />
                  <Textarea label="Причина возврата" name="reason" />
                  <SubmitButton
                    disabled={pendingAction === "refund"}
                    icon={<RefreshCw size={16} />}
                  >
                    Возврат
                  </SubmitButton>
                </form>
              </div>
            ) : (
              <p className="text-text-secondary">Платеж не привязан к заказу.</p>
            )}
          </Card>
        </aside>
      </section>
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-text-primary mt-2 text-xl font-bold break-words">{value}</p>
    </article>
  );
};

const Card = ({ children, title }: { children: ReactNode; title: string }) => {
  return (
    <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <h2 className="text-text-primary text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
};

const DetailRow = ({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) => {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span
        className={
          strong ? "text-text-primary text-right font-bold" : "text-text-primary text-right"
        }
      >
        {value}
      </span>
    </div>
  );
};

const Input = ({
  defaultValue,
  label,
  name,
  placeholder,
  required = false,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="border-border focus:border-accent-primary placeholder:text-text-muted h-11 w-full rounded-lg border bg-transparent px-3 text-sm transition outline-none"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
      />
    </label>
  );
};

const Textarea = ({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: string;
  label: string;
  name: string;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <textarea
        className="border-border focus:border-accent-primary placeholder:text-text-muted min-h-24 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm transition outline-none"
        defaultValue={defaultValue}
        name={name}
      />
    </label>
  );
};

const SubmitButton = ({
  children,
  disabled,
  icon,
  tone = "primary",
}: {
  children: ReactNode;
  disabled: boolean;
  icon: ReactNode;
  tone?: "danger" | "primary" | "secondary";
}) => {
  const className =
    tone === "danger"
      ? "bg-error text-white hover:opacity-90"
      : tone === "secondary"
        ? "border-border hover:bg-bg-hover border"
        : "bg-accent-primary text-accent-contrast hover:bg-accent-hover";

  return (
    <button
      className={`${className} inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60`}
      disabled={disabled}
      type="submit"
    >
      {icon}
      {children}
    </button>
  );
};

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => {
  return (
    <div
      className={
        tone === "error"
          ? "border-error text-error rounded-lg border bg-red-50 p-4 text-sm font-bold"
          : "text-success rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold"
      }
    >
      {children}
    </div>
  );
};

const TableHeader = ({ children }: { children: ReactNode }) => {
  return <th className="px-4 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: ReactNode }) => {
  return <td className="px-4 py-4 text-sm">{children}</td>;
};

const getNullableFormValue = (formData: FormData, name: string): string | null => {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
};

const getRequiredFormValue = (formData: FormData, name: string): string => {
  return getNullableFormValue(formData, name) ?? "";
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatQuantity = (value: string): string => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3,
  }).format(amount);
};

const formatDeliveryAddress = (order: AdminOrderDetailResponse): string => {
  if (!order.address) {
    return "-";
  }

  return [
    order.address.city,
    order.address.street,
    order.address.house,
    order.address.apartment ? `кв. ${order.address.apartment}` : null,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatPickupPoint = (order: AdminOrderDetailResponse): string => {
  if (!order.pickup_point) {
    return "-";
  }

  return `${order.pickup_point.name}, ${order.pickup_point.city}, ${order.pickup_point.address}`;
};
