"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { adminPromoCodeApi, type AdminPromoCodeDetailResponse } from "@/entities/admin-promo-code";
import { ROUTES } from "@/shared/config";

interface AdminPromoCodeDetailsViewProps {
  promoCode: AdminPromoCodeDetailResponse;
}

export const AdminPromoCodeDetailsView = ({ promoCode }: AdminPromoCodeDetailsViewProps) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (): void => {
    if (!window.confirm("Удалить промокод? Действие нельзя отменить.")) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setError(null);

    void adminPromoCodeApi
      .delete(promoCode.id)
      .then((response) => {
        setMessage(response.message);
        router.push(ROUTES.ADMIN_PROMO_CODES);
        router.refresh();
      })
      .catch(() => {
        setError("Не удалось удалить промокод. Проверьте права доступа или войдите заново.");
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">{promoCode.code}</h1>
          <p className="text-text-secondary mt-2">{promoCode.name ?? "Без названия"}</p>
        </div>
        <StatusPill active={promoCode.is_active} falseLabel="Неактивен" trueLabel="Активен" />
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Использований" value={promoCode.usage_count.toLocaleString("ru-RU")} />
        <SummaryCard label="Общий лимит" value={formatLimit(promoCode.usage_limit)} />
        <SummaryCard label="На пользователя" value={formatLimit(promoCode.user_usage_limit)} />
        <SummaryCard label="Скидка" value={formatDiscountValue(promoCode)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Данные промокода">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Код" value={promoCode.code} />
              <DetailRow label="Название" value={promoCode.name ?? "-"} />
              <DetailRow label="Описание" value={promoCode.description ?? "-"} />
              <DetailRow label="Тип скидки" value={promoCode.discount_type} />
              <DetailRow
                label="Минимальный заказ"
                value={formatMoney(promoCode.min_order_amount)}
              />
              <DetailRow
                label="Максимальная скидка"
                value={formatMoney(promoCode.max_discount_amount)}
              />
              <DetailRow label="Начало" value={formatNullableDate(promoCode.starts_at)} />
              <DetailRow label="Окончание" value={formatNullableDate(promoCode.ends_at)} />
              <DetailRow label="Обновлен" value={formatNullableDate(promoCode.updated_at)} />
            </div>
          </Card>

          <Card title="Ограничения по товарам">
            {promoCode.products && promoCode.products.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {promoCode.products.map((product) => (
                  <RelatedItem key={product.id} meta={`${product.price} ₽`} title={product.name} />
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Ограничений по товарам нет.</p>
            )}
          </Card>

          <Card title="Ограничения по категориям">
            {promoCode.categories && promoCode.categories.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {promoCode.categories.map((category) => (
                  <RelatedItem key={category.id} meta={`ID ${category.id}`} title={category.name} />
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Ограничений по категориям нет.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Статистика">
            <div className="space-y-3">
              <DetailRow
                label="Использовано"
                value={promoCode.usage_count.toLocaleString("ru-RU")}
              />
              <DetailRow label="Осталось" value={formatUsageLeft(promoCode)} />
            </div>
          </Card>

          <Card title="Удаление">
            <button
              className="bg-error inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              disabled={isDeleting}
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

const formatDiscountValue = (promoCode: AdminPromoCodeDetailResponse): string => {
  return promoCode.discount_type === "percent"
    ? `${promoCode.discount_value}%`
    : `${promoCode.discount_value} ₽`;
};

const formatMoney = (value?: string | null): string => {
  return value ? `${value} ₽` : "-";
};

const formatLimit = (value?: number | null): string => {
  return value === null || value === undefined ? "без лимита" : value.toLocaleString("ru-RU");
};

const formatUsageLeft = (promoCode: AdminPromoCodeDetailResponse): string => {
  if (promoCode.usage_limit === null || promoCode.usage_limit === undefined) {
    return "без лимита";
  }

  return Math.max(promoCode.usage_limit - promoCode.usage_count, 0).toLocaleString("ru-RU");
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
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
