"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, X } from "lucide-react";
import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import { adminProductApi } from "@/entities/admin-product";
import type { AdminProductCreateRequest } from "@/entities/admin-product";
import { getStoredAdminAccessToken } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";

interface AdminProductCreateFormProps {
  categories: AdminCategoryListItemResponse[];
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

const defaultDecimal = {
  lowStockThreshold: "0",
  minQuantity: "1",
  quantityStep: "1",
  stockQuantity: "0",
};

export const AdminProductCreateForm = ({ categories }: AdminProductCreateFormProps) => {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedFiles(Array.from(event.target.files ?? []));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = buildCreatePayload(formData);
    const validationMessage = validatePayload(payload);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage(null);
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);

        const accessToken = getStoredAdminAccessToken();
        const product = await adminProductApi.create(payload, accessToken);

        await Promise.all(
          selectedFiles.map(async (file, index) => {
            await adminProductApi.uploadImage(
              {
                entity_type: "product",
                file,
              },
              accessToken,
            );

            await adminProductApi.addImage(
              product.id,
              {
                file,
                is_main: index === 0,
                sort_order: index,
              },
              accessToken,
            );
          }),
        );

        setSuccessMessage("Товар создан.");
        router.replace(ROUTES.ADMIN_PRODUCT_EDIT(product.id));
        router.refresh();
      } catch {
        setErrorMessage("Не удалось создать товар. Проверьте поля и попробуйте снова.");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Создание товара</h1>
            <p className="text-text-secondary mt-2">Основные данные, остатки, SEO и изображения.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
              href={ROUTES.ADMIN_PRODUCTS}
            >
              Отмена
            </Link>
            <button
              className={cn(
                "bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:cursor-wait disabled:opacity-65",
                isPending && "opacity-75",
              )}
              type="submit"
              disabled={isPending}
            >
              <Save size={18} />
              {isPending ? "Сохраняем..." : "Создать"}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-success">
            {successMessage}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FormSection title="Основное">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Название" required>
                <TextInput name="name" placeholder="Например: Яблоки Гала" />
              </FormField>
              <FormField label="Slug" required>
                <TextInput name="slug" placeholder="yabloki-gala" />
              </FormField>
              <FormField label="Категория">
                <select
                  className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-bg-primary px-3 text-sm outline-none transition"
                  name="category_id"
                >
                  <option value="">Без категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Единица измерения" required>
                <TextInput defaultValue="шт" name="unit" placeholder="шт, кг, л" />
              </FormField>
              <FormField label="Тип товара" required>
                <select
                  className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-bg-primary px-3 text-sm outline-none transition"
                  defaultValue="piece"
                  name="product_type"
                >
                  <option value="piece">Штучный</option>
                  <option value="weight">Весовой</option>
                </select>
              </FormField>
              <FormField label="SKU">
                <TextInput name="sku" placeholder="SKU" />
              </FormField>
              <FormField label="Barcode">
                <TextInput name="barcode" placeholder="Штрихкод" />
              </FormField>
            </div>
            <FormField label="Описание">
              <textarea
                className="border-border focus:border-accent-primary min-h-28 w-full rounded-lg border bg-transparent px-3 py-3 text-sm outline-none transition placeholder:text-text-muted"
                name="description"
                placeholder="Описание товара"
              />
            </FormField>
          </FormSection>

          <FormSection title="Цена и остатки">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Цена" required>
                <TextInput inputMode="decimal" name="price" placeholder="0.00" />
              </FormField>
              <FormField label="Старая цена">
                <TextInput inputMode="decimal" name="old_price" placeholder="0.00" />
              </FormField>
              <FormField label="Шаг количества" required>
                <TextInput
                  defaultValue={defaultDecimal.quantityStep}
                  inputMode="decimal"
                  name="quantity_step"
                />
              </FormField>
              <FormField label="Минимальное количество" required>
                <TextInput
                  defaultValue={defaultDecimal.minQuantity}
                  inputMode="decimal"
                  name="min_quantity"
                />
              </FormField>
              <FormField label="Остаток" required>
                <TextInput
                  defaultValue={defaultDecimal.stockQuantity}
                  inputMode="decimal"
                  name="stock_quantity"
                />
              </FormField>
              <FormField label="Порог низкого остатка" required>
                <TextInput
                  defaultValue={defaultDecimal.lowStockThreshold}
                  inputMode="decimal"
                  name="low_stock_threshold"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="SEO">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Meta title">
                <TextInput name="meta_title" placeholder="SEO заголовок" />
              </FormField>
              <FormField label="Meta description">
                <TextInput name="meta_description" placeholder="SEO описание" />
              </FormField>
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6">
          <FormSection title="Статусы">
            <div className="space-y-4">
              <CheckboxField defaultChecked label="Активность" name="is_active" />
              <CheckboxField defaultChecked label="Доступность" name="is_available" />
            </div>
          </FormSection>

          <FormSection title="Изображения">
            <label className="border-border hover:bg-bg-hover flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition">
              <ImagePlus className="text-accent-primary" size={28} />
              <span className="mt-3 text-sm font-bold text-text-primary">Загрузить изображения</span>
              <span className="text-text-muted mt-1 text-xs">Первое изображение станет главным</span>
              <input
                className="sr-only"
                multiple
                name="images"
                type="file"
                accept="image/*"
                onChange={handleFilesChange}
              />
            </label>

            {selectedFiles.length > 0 ? (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file) => (
                  <div
                    className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                    key={`${file.name}-${file.size}`}
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <span className="text-text-muted shrink-0">{formatFileSize(file.size)}</span>
                  </div>
                ))}
                <button
                  className="text-text-secondary hover:text-error inline-flex items-center gap-2 text-sm font-bold transition"
                  type="button"
                  onClick={() => setSelectedFiles([])}
                >
                  <X size={16} />
                  Очистить
                </button>
              </div>
            ) : null}
          </FormSection>
        </aside>
      </section>
    </form>
  );
};

const FormSection = ({ children, title }: { children: React.ReactNode; title: string }) => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
};

const FormField = ({ children, label, required = false }: FormFieldProps) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">
        {label} {required ? <span className="text-error">*</span> : null}
      </span>
      {children}
    </label>
  );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
}

const TextInput = ({ className, type = "text", ...props }: TextInputProps) => {
  return (
    <input
      className={cn(
        "border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition placeholder:text-text-muted",
        className,
      )}
      type={type}
      {...props}
    />
  );
};

const CheckboxField = ({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) => {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg bg-bg-secondary px-4 py-3">
      <span className="font-bold">{label}</span>
      <input
        className="size-5 rounded accent-[var(--color-accent-primary)]"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value="true"
      />
    </label>
  );
};

const buildCreatePayload = (formData: FormData): AdminProductCreateRequest => {
  const metaTitle = getOptionalString(formData, "meta_title");
  const metaDescription = getOptionalString(formData, "meta_description");

  const payload: AdminProductCreateRequest = {
    is_active: formData.get("is_active") === "true",
    is_available: formData.get("is_available") === "true",
    low_stock_threshold: getRequiredString(formData, "low_stock_threshold"),
    min_quantity: getRequiredString(formData, "min_quantity"),
    name: getRequiredString(formData, "name"),
    price: getRequiredString(formData, "price"),
    product_type: getRequiredString(formData, "product_type"),
    quantity_step: getRequiredString(formData, "quantity_step"),
    slug: getRequiredString(formData, "slug"),
    stock_quantity: getRequiredString(formData, "stock_quantity"),
    unit: getRequiredString(formData, "unit"),
  };

  const categoryId = Number(getOptionalString(formData, "category_id"));

  if (Number.isInteger(categoryId) && categoryId > 0) {
    payload.category_id = categoryId;
  }

  setOptionalValue(payload, "barcode", getOptionalString(formData, "barcode"));
  setOptionalValue(payload, "description", getOptionalString(formData, "description"));
  setOptionalValue(payload, "old_price", getOptionalString(formData, "old_price"));
  setOptionalValue(payload, "sku", getOptionalString(formData, "sku"));

  if (metaTitle || metaDescription) {
    payload.seo = {
      meta_description: metaDescription,
      meta_title: metaTitle,
    };
  }

  return payload;
};

const validatePayload = (payload: AdminProductCreateRequest): string | null => {
  if (payload.name.length < 2) {
    return "Введите название товара.";
  }

  if (payload.slug.length < 2) {
    return "Введите slug товара.";
  }

  if (!isPositiveNumber(payload.price)) {
    return "Введите корректную цену.";
  }

  if (!payload.unit) {
    return "Введите единицу измерения.";
  }

  return null;
};

const setOptionalValue = (
  payload: AdminProductCreateRequest,
  key: "barcode" | "description" | "old_price" | "sku",
  value: string | null,
): void => {
  if (value) {
    payload[key] = value;
  }
};

const getRequiredString = (formData: FormData, key: string): string => {
  return String(formData.get(key) ?? "").trim();
};

const getOptionalString = (formData: FormData, key: string): string | null => {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : null;
};

const isPositiveNumber = (value: string): boolean => {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0;
};

const formatFileSize = (size: number): string => {
  if (size < 1024 * 1024) {
    return `${Math.max(Math.round(size / 1024), 1)} КБ`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
};
