"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import {
  adminDiscountApi,
  type AdminDiscountDetailResponse,
  type AdminDiscountPayload,
} from "@/entities/admin-discount";
import type { AdminProductListItemResponse } from "@/entities/admin-product";
import { ROUTES } from "@/shared/config";

interface AdminDiscountFormViewProps {
  categories: AdminCategoryListItemResponse[];
  discount?: AdminDiscountDetailResponse;
  products: AdminProductListItemResponse[];
}

export const AdminDiscountFormView = ({
  categories,
  discount,
  products,
}: AdminDiscountFormViewProps) => {
  const router = useRouter();
  const isEditMode = Boolean(discount);
  const [targetType, setTargetType] = useState(discount?.type ?? "product");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProductIds = useMemo(() => {
    return new Set((discount?.products ?? []).map((product) => product.id));
  }, [discount?.products]);

  const selectedCategoryIds = useMemo(() => {
    return new Set((discount?.categories ?? []).map((category) => category.id));
  }, [discount?.categories]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = createDiscountPayload(formData);

    setIsPending(true);
    setError(null);

    const request =
      discount === undefined
        ? adminDiscountApi.create(payload)
        : adminDiscountApi.update(discount.id, payload);

    void request
      .then((response) => {
        router.push(ROUTES.ADMIN_DISCOUNT_EDIT(response.id));
        router.refresh();
      })
      .catch(() => {
        setError("Не удалось сохранить скидку. Проверьте поля и права доступа.");
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
          href={ROUTES.ADMIN_DISCOUNTS}
        >
          <ArrowLeft size={16} />
          Скидки
        </Link>
        <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">
          {isEditMode ? "Редактирование скидки" : "Создание скидки"}
        </h1>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card title="Условия скидки">
              <div className="grid gap-4 md:grid-cols-2">
                <Input defaultValue={discount?.name} label="Название" name="name" required />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">Тип скидки</span>
                  <select
                    className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                    name="type"
                    onChange={(event) => {
                      setTargetType(event.target.value);
                    }}
                    value={targetType}
                  >
                    <option value="product">Товар</option>
                    <option value="category">Категория</option>
                    <option value="cart">Корзина</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">Расчет</span>
                  <select
                    className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                    defaultValue={discount?.discount_type ?? "percent"}
                    name="discount_type"
                  >
                    <option value="percent">Процент</option>
                    <option value="fixed">Фиксированная сумма</option>
                  </select>
                </label>
                <Input
                  defaultValue={discount?.discount_value}
                  label="Значение"
                  min="0"
                  name="discount_value"
                  required
                  step="0.01"
                  type="number"
                />
                <Input
                  defaultValue={toDateTimeLocalValue(discount?.starts_at)}
                  label="Начало"
                  name="starts_at"
                  type="datetime-local"
                />
                <Input
                  defaultValue={toDateTimeLocalValue(discount?.ends_at)}
                  label="Окончание"
                  name="ends_at"
                  type="datetime-local"
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">Активность</span>
                  <select
                    className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                    defaultValue={String(discount?.is_active ?? true)}
                    name="is_active"
                  >
                    <option value="true">Активна</option>
                    <option value="false">Неактивна</option>
                  </select>
                </label>
              </div>
            </Card>

            <Card title="Товары">
              <MultiSelect
                disabled={targetType === "cart" || targetType === "category"}
                name="product_ids"
                options={products.map((product) => ({
                  id: product.id,
                  label: `${product.name} · ${product.price} ₽`,
                  selected: selectedProductIds.has(product.id),
                }))}
              />
            </Card>

            <Card title="Категории">
              <MultiSelect
                disabled={targetType === "cart" || targetType === "product"}
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
                {discount ? (
                  <>
                    <DetailRow label="ID" value={String(discount.id)} />
                    <DetailRow label="Обновлена" value={formatNullableDate(discount.updated_at)} />
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
                {isEditMode ? "Сохранить" : "Создать скидку"}
              </button>
              <Link
                className="border-border hover:bg-bg-hover mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
                href={ROUTES.ADMIN_DISCOUNTS}
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
  disabled,
  name,
  options,
}: {
  disabled: boolean;
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
      className="border-border focus:border-accent-primary bg-bg-primary min-h-48 w-full rounded-lg border px-3 py-2 text-sm transition outline-none disabled:opacity-50"
      defaultValue={options.filter((option) => option.selected).map((option) => String(option.id))}
      disabled={disabled}
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

const createDiscountPayload = (formData: FormData): AdminDiscountPayload => {
  const type = getRequiredFormValue(formData, "type");
  const payload: AdminDiscountPayload = {
    discount_type: getRequiredFormValue(formData, "discount_type"),
    discount_value: getRequiredFormValue(formData, "discount_value"),
    ends_at: getNullableDateTimeFormValue(formData, "ends_at"),
    is_active: formData.get("is_active") === "true",
    name: getRequiredFormValue(formData, "name"),
    starts_at: getNullableDateTimeFormValue(formData, "starts_at"),
    type,
  };

  if (type === "product") {
    payload.product_ids = getNumberArrayFormValue(formData, "product_ids");
    payload.category_ids = [];
  }

  if (type === "category") {
    payload.category_ids = getNumberArrayFormValue(formData, "category_ids");
    payload.product_ids = [];
  }

  if (type === "cart") {
    payload.category_ids = [];
    payload.product_ids = [];
  }

  return payload;
};

const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
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
