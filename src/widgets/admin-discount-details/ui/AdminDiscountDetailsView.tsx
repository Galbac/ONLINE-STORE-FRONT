"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { adminDiscountApi, type AdminDiscountDetailResponse } from "@/entities/admin-discount";
import { ROUTES } from "@/shared/config";

interface AdminDiscountDetailsViewProps {
  discount: AdminDiscountDetailResponse;
}

type PendingAction = "activate" | "deactivate" | "delete";

export const AdminDiscountDetailsView = ({ discount }: AdminDiscountDetailsViewProps) => {
  const router = useRouter();
  const [isActive, setIsActive] = useState(discount.is_active);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const runAction = async (action: PendingAction, handler: () => Promise<void>): Promise<void> => {
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      await handler();
      router.refresh();
    } catch {
      setError("Операция не выполнена. Проверьте права доступа или войдите заново.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleActivate = (): void => {
    void runAction("activate", async () => {
      const response = await adminDiscountApi.activate(discount.id);
      setIsActive(response.is_active);
      setMessage(response.message);
    });
  };

  const handleDeactivate = (): void => {
    void runAction("deactivate", async () => {
      const response = await adminDiscountApi.deactivate(discount.id);
      setIsActive(response.is_active);
      setMessage(response.message);
    });
  };

  const handleDelete = (): void => {
    if (!window.confirm("Удалить скидку? Действие нельзя отменить.")) {
      return;
    }

    void runAction("delete", async () => {
      await adminDiscountApi.delete(discount.id);
      router.push(ROUTES.ADMIN_DISCOUNTS);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
            href={ROUTES.ADMIN_DISCOUNTS}
          >
            <ArrowLeft size={16} />
            Скидки
          </Link>
          <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">{discount.name}</h1>
          <p className="text-text-secondary mt-2">ID {discount.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill active={isActive} falseLabel="Неактивна" trueLabel="Активна" />
        </div>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Тип" value={getTargetTypeLabel(discount.type)} />
        <SummaryCard
          label="Значение"
          value={formatDiscountValue(discount.discount_type, discount.discount_value)}
        />
        <SummaryCard label="Обновлена" value={formatNullableDate(discount.updated_at)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Данные скидки">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Название" value={discount.name} />
              <DetailRow label="Тип" value={getTargetTypeLabel(discount.type)} />
              <DetailRow label="Расчет" value={discount.discount_type} />
              <DetailRow
                label="Значение"
                value={formatDiscountValue(discount.discount_type, discount.discount_value)}
              />
              <DetailRow label="Начало" value={formatNullableDate(discount.starts_at)} />
              <DetailRow label="Окончание" value={formatNullableDate(discount.ends_at)} />
            </div>
          </Card>

          <Card title="Связанные товары">
            {discount.products && discount.products.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {discount.products.map((product) => (
                  <RelatedItem key={product.id} meta={`${product.price} ₽`} title={product.name} />
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Товары не привязаны.</p>
            )}
          </Card>

          <Card title="Связанные категории">
            {discount.categories && discount.categories.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {discount.categories.map((category) => (
                  <RelatedItem key={category.id} meta={`ID ${category.id}`} title={category.name} />
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Категории не привязаны.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Статус">
            {isActive ? (
              <button
                className="border-border hover:bg-bg-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={pendingAction === "deactivate"}
                onClick={handleDeactivate}
                type="button"
              >
                <ToggleLeft size={16} />
                Деактивировать
              </button>
            ) : (
              <button
                className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={pendingAction === "activate"}
                onClick={handleActivate}
                type="button"
              >
                <ToggleRight size={16} />
                Активировать
              </button>
            )}
          </Card>

          <Card title="Удаление">
            <button
              className="bg-error inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              disabled={pendingAction === "delete"}
              onClick={handleDelete}
              type="button"
            >
              <Trash2 size={16} />
              Удалить
            </button>
          </Card>
        </aside>
      </section>
    </div>
  );
};

const RelatedItem = ({ meta, title }: { meta: string; title: string }) => {
  return (
    <article className="border-border rounded-lg border p-4">
      <p className="text-text-primary font-bold">{title}</p>
      <p className="text-text-muted mt-1 text-xs">{meta}</p>
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

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-text-primary mt-2 text-2xl font-bold break-words">{value}</p>
    </article>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary text-right font-bold">{value}</span>
    </div>
  );
};

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => {
  return (
    <div
      className={
        tone === "success"
          ? "border-border bg-bg-primary text-success rounded-lg border p-4 text-sm font-bold"
          : "border-border bg-bg-primary text-error rounded-lg border p-4 text-sm font-bold"
      }
    >
      {children}
    </div>
  );
};

const StatusPill = ({
  active,
  falseLabel,
  trueLabel,
}: {
  active: boolean;
  falseLabel: string;
  trueLabel: string;
}) => {
  return (
    <span
      className={
        active
          ? "text-success inline-flex rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold"
          : "text-error inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold"
      }
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
};

const getTargetTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    cart: "Корзина",
    category: "Категория",
    product: "Товар",
  };

  return labels[type] ?? type;
};

const formatDiscountValue = (discountType: string, value: string): string => {
  if (discountType === "percent") {
    return `${value}%`;
  }

  return `${value} ₽`;
};

const formatNullableDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
