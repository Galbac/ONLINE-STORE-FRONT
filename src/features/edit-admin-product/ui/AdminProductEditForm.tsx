"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Save, Trash2, X } from "lucide-react";
import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import { adminProductApi } from "@/entities/admin-product";
import type {
  AdminProductDetailResponse,
  AdminProductImageResponse,
  AdminProductUpdateRequest,
} from "@/entities/admin-product";
import { getStoredAdminAccessToken } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";

interface AdminProductEditFormProps {
  categories: AdminCategoryListItemResponse[];
  product: AdminProductDetailResponse;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

export const AdminProductEditForm = ({ categories, product }: AdminProductEditFormProps) => {
  const router = useRouter();
  const [images, setImages] = useState<AdminProductImageResponse[]>(sortImages(product.images ?? []));
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
    const payload = buildUpdatePayload(formData);
    const validationMessage = validatePayload(payload);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage(null);
      return;
    }

    startTransition(async () => {
      try {
        const accessToken = getStoredAdminAccessToken();

        setErrorMessage(null);
        setSuccessMessage(null);

        await adminProductApi.update(product.id, payload, accessToken);
        await adminProductApi.updateStock(
          product.id,
          {
            low_stock_threshold: payload.low_stock_threshold ?? product.low_stock_threshold,
            stock_quantity: payload.stock_quantity ?? product.stock_quantity,
          },
          accessToken,
        );
        await adminProductApi.updateAvailability(
          product.id,
          {
            is_available: payload.is_available ?? product.is_available,
          },
          accessToken,
        );

        const uploadedImages = await Promise.all(
          selectedFiles.map(async (file, index) => {
            await adminProductApi.uploadImage(
              {
                entity_type: "product",
                file,
              },
              accessToken,
            );

            return adminProductApi.addImage(
              product.id,
              {
                file,
                is_main: images.length === 0 && index === 0,
                sort_order: images.length + index,
              },
              accessToken,
            );
          }),
        );

        if (uploadedImages.length > 0) {
          setImages(sortImages([...images, ...uploadedImages]));
          setSelectedFiles([]);
        }

        setSuccessMessage("Товар обновлен.");
        router.refresh();
      } catch {
        setErrorMessage("Не удалось сохранить товар. Проверьте поля и попробуйте снова.");
      }
    });
  };

  const handleDeleteProduct = (): void => {
    if (!window.confirm("Удалить товар?")) {
      return;
    }

    startTransition(async () => {
      try {
        await adminProductApi.deleteById(product.id, getStoredAdminAccessToken());
        router.replace(ROUTES.ADMIN_PRODUCTS);
        router.refresh();
      } catch {
        setErrorMessage("Не удалось удалить товар.");
      }
    });
  };

  const handleDeleteImage = (image: AdminProductImageResponse): void => {
    startTransition(async () => {
      try {
        const accessToken = getStoredAdminAccessToken();

        await adminProductApi.deleteImage(product.id, image.id, accessToken);

        if (image.file_id) {
          await adminProductApi.deleteUpload(image.file_id, accessToken).catch(() => undefined);
        }

        setImages((currentImages) => normalizeImageSort(currentImages.filter((item) => item.id !== image.id)));
        router.refresh();
      } catch {
        setErrorMessage("Не удалось удалить изображение.");
      }
    });
  };

  const handleMoveImage = (imageId: number, direction: "up" | "down"): void => {
    const currentIndex = images.findIndex((image) => image.id === imageId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reorderedImages = [...images];
    const currentImage = reorderedImages[currentIndex];
    const targetImage = reorderedImages[targetIndex];

    if (!currentImage || !targetImage) {
      return;
    }

    reorderedImages[currentIndex] = targetImage;
    reorderedImages[targetIndex] = currentImage;
    const normalizedImages = normalizeImageSort(reorderedImages);
    setImages(normalizedImages);

    startTransition(async () => {
      try {
        const response = await adminProductApi.sortImages(
          product.id,
          {
            items: normalizedImages.map((image) => ({
              id: image.id,
              is_main: image.is_main ?? false,
              sort_order: image.sort_order,
            })),
          },
          getStoredAdminAccessToken(),
        );

        setImages(sortImages(response.items));
        router.refresh();
      } catch {
        setErrorMessage("Не удалось отсортировать изображения.");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Редактирование товара</h1>
            <p className="text-text-secondary mt-2">ID {product.id}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <StatusLabel label="sync_status" value={product.sync_status ?? "-"} />
              <StatusLabel label="1C" value={product.external_1c_id ?? "-"} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
              href={ROUTES.ADMIN_PRODUCTS}
            >
              К списку
            </Link>
            <button
              className="border-border text-error hover:bg-red-50 inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:cursor-wait disabled:opacity-65"
              type="button"
              disabled={isPending}
              onClick={handleDeleteProduct}
            >
              <Trash2 size={18} />
              Удалить
            </button>
            <button
              className={cn(
                "bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:cursor-wait disabled:opacity-65",
                isPending && "opacity-75",
              )}
              type="submit"
              disabled={isPending}
            >
              <Save size={18} />
              {isPending ? "Сохраняем..." : "Сохранить"}
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <FormSection title="Основное">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Название" required>
                <TextInput defaultValue={product.name} name="name" />
              </FormField>
              <FormField label="Slug" required>
                <TextInput defaultValue={product.slug} name="slug" />
              </FormField>
              <FormField label="Категория">
                <select
                  className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-bg-primary px-3 text-sm outline-none transition"
                  defaultValue={product.category_id ?? ""}
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
                <TextInput defaultValue={product.unit} name="unit" />
              </FormField>
              <FormField label="Тип товара" required>
                <select
                  className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-bg-primary px-3 text-sm outline-none transition"
                  defaultValue={product.product_type}
                  name="product_type"
                >
                  <option value="piece">Штучный</option>
                  <option value="weight">Весовой</option>
                </select>
              </FormField>
              <FormField label="SKU">
                <TextInput defaultValue={product.sku ?? ""} name="sku" />
              </FormField>
              <FormField label="Barcode">
                <TextInput defaultValue={product.barcode ?? ""} name="barcode" />
              </FormField>
            </div>
            <FormField label="Описание">
              <textarea
                className="border-border focus:border-accent-primary min-h-28 w-full rounded-lg border bg-transparent px-3 py-3 text-sm outline-none transition placeholder:text-text-muted"
                defaultValue={product.description ?? ""}
                name="description"
              />
            </FormField>
          </FormSection>

          <FormSection title="Цена и остатки">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Цена" required>
                <TextInput defaultValue={product.price} inputMode="decimal" name="price" />
              </FormField>
              <FormField label="Старая цена">
                <TextInput defaultValue={product.old_price ?? ""} inputMode="decimal" name="old_price" />
              </FormField>
              <FormField label="Шаг количества" required>
                <TextInput defaultValue={product.quantity_step} inputMode="decimal" name="quantity_step" />
              </FormField>
              <FormField label="Минимальное количество" required>
                <TextInput defaultValue={product.min_quantity} inputMode="decimal" name="min_quantity" />
              </FormField>
              <FormField label="Остаток" required>
                <TextInput defaultValue={product.stock_quantity} inputMode="decimal" name="stock_quantity" />
              </FormField>
              <FormField label="Порог низкого остатка" required>
                <TextInput
                  defaultValue={product.low_stock_threshold}
                  inputMode="decimal"
                  name="low_stock_threshold"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="SEO">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Meta title">
                <TextInput defaultValue={product.seo?.meta_title ?? ""} name="meta_title" />
              </FormField>
              <FormField label="Meta description">
                <TextInput
                  defaultValue={product.seo?.meta_description ?? ""}
                  name="meta_description"
                />
              </FormField>
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6">
          <FormSection title="Статусы">
            <div className="space-y-4">
              <CheckboxField defaultChecked={product.is_active} label="Активность" name="is_active" />
              <CheckboxField
                defaultChecked={product.is_available}
                label="Доступность"
                name="is_available"
              />
            </div>
          </FormSection>

          <FormSection title="Изображения">
            <label className="border-border hover:bg-bg-hover flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition">
              <ImagePlus className="text-accent-primary" size={28} />
              <span className="mt-3 text-sm font-bold text-text-primary">Добавить изображения</span>
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
              <div className="space-y-2">
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

            <div className="space-y-3">
              {images.length > 0 ? (
                images.map((image, index) => (
                  <div className="border-border rounded-lg border p-3" key={image.id}>
                    <div
                      className="h-36 rounded-lg bg-bg-secondary bg-cover bg-center"
                      style={{ backgroundImage: `url(${image.url})` }}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold">
                        {image.is_main ? "Главное" : `Позиция ${index + 1}`}
                      </span>
                      <div className="flex gap-2">
                        <IconButton
                          disabled={index === 0 || isPending}
                          label="Выше"
                          onClick={() => handleMoveImage(image.id, "up")}
                        >
                          <ArrowUp size={16} />
                        </IconButton>
                        <IconButton
                          disabled={index === images.length - 1 || isPending}
                          label="Ниже"
                          onClick={() => handleMoveImage(image.id, "down")}
                        >
                          <ArrowDown size={16} />
                        </IconButton>
                        <IconButton
                          disabled={isPending}
                          label="Удалить"
                          onClick={() => handleDeleteImage(image)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary rounded-lg bg-bg-secondary p-4 text-sm">
                  Изображения не добавлены.
                </p>
              )}
            </div>
          </FormSection>
        </aside>
      </section>
    </form>
  );
};

const StatusLabel = ({ label, value }: { label: string; value: string }) => {
  return (
    <span className="border-border bg-bg-secondary text-text-secondary rounded-lg border px-2 py-1">
      {label}: <span className="font-bold text-text-primary">{value}</span>
    </span>
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

const IconButton = ({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) => {
  return (
    <button
      className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const buildUpdatePayload = (formData: FormData): AdminProductUpdateRequest => {
  const metaTitle = getOptionalString(formData, "meta_title");
  const metaDescription = getOptionalString(formData, "meta_description");
  const categoryId = Number(getOptionalString(formData, "category_id"));

  return {
    barcode: getOptionalString(formData, "barcode"),
    category_id: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null,
    description: getOptionalString(formData, "description"),
    is_active: formData.get("is_active") === "true",
    is_available: formData.get("is_available") === "true",
    low_stock_threshold: getRequiredString(formData, "low_stock_threshold"),
    min_quantity: getRequiredString(formData, "min_quantity"),
    name: getRequiredString(formData, "name"),
    old_price: getOptionalString(formData, "old_price"),
    price: getRequiredString(formData, "price"),
    product_type: getRequiredString(formData, "product_type"),
    quantity_step: getRequiredString(formData, "quantity_step"),
    seo:
      metaTitle || metaDescription
        ? {
            meta_description: metaDescription,
            meta_title: metaTitle,
          }
        : null,
    sku: getOptionalString(formData, "sku"),
    slug: getRequiredString(formData, "slug"),
    stock_quantity: getRequiredString(formData, "stock_quantity"),
    unit: getRequiredString(formData, "unit"),
  };
};

const validatePayload = (payload: AdminProductUpdateRequest): string | null => {
  if (!payload.name || payload.name.length < 2) {
    return "Введите название товара.";
  }

  if (!payload.slug || payload.slug.length < 2) {
    return "Введите slug товара.";
  }

  if (!payload.price || !isPositiveNumber(payload.price)) {
    return "Введите корректную цену.";
  }

  if (!payload.unit) {
    return "Введите единицу измерения.";
  }

  return null;
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

const sortImages = (images: AdminProductImageResponse[]): AdminProductImageResponse[] => {
  return [...images].sort((firstImage, secondImage) => firstImage.sort_order - secondImage.sort_order);
};

const normalizeImageSort = (images: AdminProductImageResponse[]): AdminProductImageResponse[] => {
  return images.map((image, index) => ({
    ...image,
    is_main: index === 0,
    sort_order: index,
  }));
};

const formatFileSize = (size: number): string => {
  if (size < 1024 * 1024) {
    return `${Math.max(Math.round(size / 1024), 1)} КБ`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
};
