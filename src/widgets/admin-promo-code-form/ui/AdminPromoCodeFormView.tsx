"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import type { AdminProductListItemResponse } from "@/entities/admin-product";
import {
  adminPromoCodeApi,
  type AdminPromoCodeDetailResponse,
  type AdminPromoCodePayload,
} from "@/entities/admin-promo-code";
import { ROUTES } from "@/shared/config";

interface AdminPromoCodeFormViewProps {
  categories: AdminCategoryListItemResponse[];
  products: AdminProductListItemResponse[];
  promoCode?: AdminPromoCodeDetailResponse;
}

export const AdminPromoCodeFormView = ({
  categories,
  products,
  promoCode,
}: AdminPromoCodeFormViewProps) => {
  const router = useRouter();
  const isEditMode = Boolean(promoCode);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProductIds = useMemo(() => {
    return new Set((promoCode?.products ?? []).map((product) => product.id));
  }, [promoCode?.products]);

  const selectedCategoryIds = useMemo(() => {
    return new Set((promoCode?.categories ?? []).map((category) => category.id));
  }, [promoCode?.categories]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = createPromoCodePayload(formData);

    setIsPending(true);
    setError(null);

    const request =
      promoCode === undefined
        ? adminPromoCodeApi.create(payload)
        : adminPromoCodeApi.update(promoCode.id, payload);

    void request
      .then((response) => {
        router.push(ROUTES.ADMIN_PROMO_CODE_EDIT(response.id));
        router.refresh();
      })
      .catch(() => {
        setError("Не удалось сохранить промокод. Проверьте поля и права доступа.");
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <div className="space-y-6">
      <section>
        <Link
          className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
          href={ROUTES.ADMIN_PROMO_CODES}
        >
          <ArrowLeft size={16} />
          Промокоды
        </Link>
        <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">
          {isEditMode ? "Редактирование промокода" : "Создание промокода"}
        </h1>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card title="Условия промокода">
              <div className="grid gap-4 md:grid-cols-2">
                <Input defaultValue={promoCode?.code} label="Код" name="code" required />
                <Input defaultValue={promoCode?.name ?? undefined} label="Название" name="name" />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">Тип скидки</span>
                  <select
                    className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                    defaultValue={promoCode?.discount_type ?? "percent"}
                    name="discount_type"
                  >
                    <option value="percent">Процент</option>
                    <option value="fixed">Фиксированная сумма</option>
                  </select>
                </label>
                <Input
                  defaultValue={promoCode?.discount_value}
                  label="Значение скидки"
                  min="0"
                  name="discount_value"
                  required
                  step="0.01"
                  type="number"
                />
                <Input
                  defaultValue={promoCode?.min_order_amount ?? undefined}
                  label="Минимальная сумма заказа"
                  min="0"
                  name="min_order_amount"
                  step="0.01"
                  type="number"
                />
                <Input
                  defaultValue={promoCode?.max_discount_amount ?? undefined}
                  label="Максимальная скидка"
                  min="0"
                  name="max_discount_amount"
                  step="0.01"
                  type="number"
                />
                <Input
                  defaultValue={toStringValue(promoCode?.usage_limit)}
                  label="Общий лимит"
                  min="0"
                  name="usage_limit"
                  step="1"
                  type="number"
                />
                <Input
                  defaultValue={toStringValue(promoCode?.user_usage_limit)}
                  label="Лимит на пользователя"
                  min="0"
                  name="user_usage_limit"
                  step="1"
                  type="number"
                />
                <Input
                  defaultValue={toDateTimeLocalValue(promoCode?.starts_at)}
                  label="Дата начала"
                  name="starts_at"
                  type="datetime-local"
                />
                <Input
                  defaultValue={toDateTimeLocalValue(promoCode?.ends_at)}
                  label="Дата окончания"
                  name="ends_at"
                  type="datetime-local"
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">Активность</span>
                  <select
                    className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                    defaultValue={String(promoCode?.is_active ?? true)}
                    name="is_active"
                  >
                    <option value="true">Активен</option>
                    <option value="false">Неактивен</option>
                  </select>
                </label>
              </div>
              <Textarea
                defaultValue={promoCode?.description ?? undefined}
                label="Описание"
                name="description"
              />
            </Card>

            <Card title="Ограничения по товарам">
              <MultiSelect
                name="product_ids"
                options={products.map((product) => ({
                  id: product.id,
                  label: `${product.name} · ${product.price} ₽`,
                  selected: selectedProductIds.has(product.id),
                }))}
              />
            </Card>

            <Card title="Ограничения по категориям">
              <MultiSelect
                name="category_ids"
                options={categories.map((category) => ({
                  id: category.id,
                  label: category.name,
                  selected: selectedCategoryIds.has(category.id),
                }))}
              />
            </Card>
          </div>

          <aside className="space-y-6">
            <Card title="Сводка">
              <div className="space-y-3">
                <DetailRow label="Товаров" value={products.length.toLocaleString("ru-RU")} />
                <DetailRow label="Категорий" value={categories.length.toLocaleString("ru-RU")} />
                {promoCode ? (
                  <>
                    <DetailRow label="ID" value={String(promoCode.id)} />
                    <DetailRow label="Использований" value={String(promoCode.usage_count)} />
                  </>
                ) : null}
              </div>
            </Card>

            <Card title="Сохранение">
              <button
                className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                <Save size={16} />
                {isEditMode ? "Сохранить" : "Создать промокод"}
              </button>
              <Link
                className="border-border hover:bg-bg-hover mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
                href={ROUTES.ADMIN_PROMO_CODES}
              >
                Отмена
              </Link>
            </Card>
          </aside>
        </section>
      </form>
    </div>
  );
};

const MultiSelect = ({
  name,
  options,
}: {
  name: string;
  options: Array<{
    id: number;
    label: string;
    selected: boolean;
  }>;
}) => {
  if (options.length === 0) {
    return <p className="text-text-secondary">Нет данных.</p>;
  }

  return (
    <select
      className="border-border focus:border-accent-primary bg-bg-primary min-h-48 w-full rounded-lg border px-3 py-2 text-sm transition outline-none"
      defaultValue={options.filter((option) => option.selected).map((option) => String(option.id))}
      multiple
      name={name}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
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

const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary text-right font-bold">{value}</span>
    </div>
  );
};

const Input = ({
  defaultValue,
  label,
  min,
  name,
  required = false,
  step,
  type = "text",
}: {
  defaultValue?: string | undefined;
  label: string;
  min?: string | undefined;
  name: string;
  required?: boolean;
  step?: string | undefined;
  type?: string;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        defaultValue={defaultValue}
        min={min}
        name={name}
        required={required}
        step={step}
        type={type}
      />
    </label>
  );
};

const Textarea = ({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: string | undefined;
  label: string;
  name: string;
}) => {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <textarea
        className="border-border focus:border-accent-primary bg-bg-primary min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-sm transition outline-none"
        defaultValue={defaultValue}
        name={name}
      />
    </label>
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

const createPromoCodePayload = (formData: FormData): AdminPromoCodePayload => {
  return {
    category_ids: getNumberArrayFormValue(formData, "category_ids"),
    code: getRequiredFormValue(formData, "code"),
    description: getNullableFormValue(formData, "description"),
    discount_type: getRequiredFormValue(formData, "discount_type"),
    discount_value: getRequiredFormValue(formData, "discount_value"),
    ends_at: getNullableDateTimeFormValue(formData, "ends_at"),
    is_active: formData.get("is_active") === "true",
    max_discount_amount: getNullableFormValue(formData, "max_discount_amount"),
    min_order_amount: getNullableFormValue(formData, "min_order_amount"),
    name: getNullableFormValue(formData, "name"),
    product_ids: getNumberArrayFormValue(formData, "product_ids"),
    starts_at: getNullableDateTimeFormValue(formData, "starts_at"),
    usage_limit: getNullableNumberFormValue(formData, "usage_limit"),
    user_usage_limit: getNullableNumberFormValue(formData, "user_usage_limit"),
  };
};

const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const getNullableFormValue = (formData: FormData, key: string): string | null => {
  const value = getRequiredFormValue(formData, key);

  return value || null;
};

const getNullableNumberFormValue = (formData: FormData, key: string): number | null => {
  const value = Number(getRequiredFormValue(formData, key));

  return Number.isInteger(value) && value >= 0 ? value : null;
};

const getNumberArrayFormValue = (formData: FormData, key: string): number[] => {
  return formData
    .getAll(key)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
};

const getNullableDateTimeFormValue = (formData: FormData, key: string): string | null => {
  const value = getRequiredFormValue(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const toDateTimeLocalValue = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toStringValue = (value?: number | null): string | undefined => {
  return value === null || value === undefined ? undefined : String(value);
};
