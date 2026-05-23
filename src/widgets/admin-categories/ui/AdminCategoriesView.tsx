"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  FolderTree,
  GripVertical,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { adminCategoryApi } from "@/entities/admin-category";
import type {
  AdminCategoryDetailResponse,
  AdminCategoryListItemResponse,
  AdminCategoryPayload,
  AdminCategorySortPayload,
} from "@/entities/admin-category";
import { getStoredAdminAccessToken } from "@/shared/api";
import { cn } from "@/shared/config";

interface AdminCategoriesViewProps {
  initialCategories: AdminCategoryListItemResponse[];
}

interface CategoryTreeItem extends AdminCategoryListItemResponse {
  children: CategoryTreeItem[];
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

export const AdminCategoriesView = ({ initialCategories }: AdminCategoriesViewProps) => {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategoryListItemResponse[]>(
    sortCategories(initialCategories),
  );
  const [editingCategory, setEditingCategory] = useState<AdminCategoryDetailResponse | null>(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const handleEdit = (categoryId: number): void => {
    startTransition(async () => {
      try {
        const category = await adminCategoryApi.getById(categoryId, getStoredAdminAccessToken());
        setEditingCategory(category);
        setSelectedImage(null);
        setErrorMessage(null);
      } catch {
        setErrorMessage("Не удалось загрузить категорию.");
      }
    });
  };

  const handleNew = (): void => {
    setEditingCategory(null);
    setSelectedImage(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const payload = buildPayload(new FormData(event.currentTarget));
    const validationMessage = validatePayload(payload);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage(null);
      return;
    }

    startTransition(async () => {
      try {
        const accessToken = getStoredAdminAccessToken();
        const image = selectedImage
          ? await adminCategoryApi.uploadImage(
              {
                entity_type: "category",
                file: selectedImage,
              },
              accessToken,
            )
          : null;
        const requestPayload = image ? { ...payload, image_id: image.id } : payload;
        const savedCategory = editingCategory
          ? await adminCategoryApi.update(editingCategory.id, requestPayload, accessToken)
          : await adminCategoryApi.create(requestPayload, accessToken);

        setCategories((currentCategories) => upsertListCategory(currentCategories, savedCategory));
        setEditingCategory(savedCategory);
        setSelectedImage(null);
        setSuccessMessage(editingCategory ? "Категория обновлена." : "Категория создана.");
        setErrorMessage(null);
        router.refresh();
      } catch {
        setErrorMessage("Не удалось сохранить категорию. Проверьте поля и попробуйте снова.");
        setSuccessMessage(null);
      }
    });
  };

  const handleDelete = (): void => {
    if (!editingCategory || !window.confirm("Удалить категорию?")) {
      return;
    }

    startTransition(async () => {
      try {
        await adminCategoryApi.deleteById(editingCategory.id, getStoredAdminAccessToken());
        setCategories((currentCategories) =>
          currentCategories.filter((category) => category.id !== editingCategory.id),
        );
        setEditingCategory(null);
        setSuccessMessage("Категория удалена.");
        router.refresh();
      } catch {
        setErrorMessage("Не удалось удалить категорию.");
      }
    });
  };

  const handleDeleteImage = (): void => {
    if (!editingCategory?.image?.id) {
      return;
    }

    startTransition(async () => {
      try {
        const accessToken = getStoredAdminAccessToken();
        await adminCategoryApi.update(editingCategory.id, { image_id: null }, accessToken);
        await adminCategoryApi.deleteUpload(editingCategory.image?.id ?? 0, accessToken).catch(() => undefined);
        const updatedCategory = { ...editingCategory, image: null, image_url: null };

        setEditingCategory(updatedCategory);
        setCategories((currentCategories) => upsertListCategory(currentCategories, updatedCategory));
        router.refresh();
      } catch {
        setErrorMessage("Не удалось удалить изображение.");
      }
    });
  };

  const handleDropOnCategory = (targetParentId: number | null): void => {
    if (!draggedCategoryId || draggedCategoryId === targetParentId) {
      setDraggedCategoryId(null);
      return;
    }

    if (targetParentId && isDescendant(categories, draggedCategoryId, targetParentId)) {
      setErrorMessage("Нельзя перенести категорию внутрь собственной ветки.");
      setDraggedCategoryId(null);
      return;
    }

    const movedCategories = categories.map((category) =>
      category.id === draggedCategoryId ? { ...category, parent_id: targetParentId } : category,
    );

    persistSort(normalizeSortOrders(movedCategories));
    setDraggedCategoryId(null);
  };

  const handleMoveWithinParent = (categoryId: number, direction: "up" | "down"): void => {
    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    const siblings = sortCategories(
      categories.filter((item) => (item.parent_id ?? null) === (category.parent_id ?? null)),
    );
    const currentIndex = siblings.findIndex((item) => item.id === categoryId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= siblings.length) {
      return;
    }

    const reorderedSiblings = [...siblings];
    const currentSibling = reorderedSiblings[currentIndex];
    const targetSibling = reorderedSiblings[targetIndex];

    if (!currentSibling || !targetSibling) {
      return;
    }

    reorderedSiblings[currentIndex] = targetSibling;
    reorderedSiblings[targetIndex] = currentSibling;

    const nextCategories = categories.map((item) => {
      const siblingIndex = reorderedSiblings.findIndex((sibling) => sibling.id === item.id);

      return siblingIndex >= 0 ? { ...item, sort_order: siblingIndex } : item;
    });

    persistSort(nextCategories);
  };

  const persistSort = (nextCategories: AdminCategoryListItemResponse[]): void => {
    const normalizedCategories = normalizeSortOrders(nextCategories);
    setCategories(sortCategories(normalizedCategories));

    startTransition(async () => {
      try {
        await adminCategoryApi.sort(toSortPayload(normalizedCategories), getStoredAdminAccessToken());
        setSuccessMessage("Порядок категорий обновлен.");
        router.refresh();
      } catch {
        setErrorMessage("Не удалось сохранить порядок категорий.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Категории</h1>
            <p className="text-text-secondary mt-2">
              Список, дерево, перенос, сортировка и изображения категорий.
            </p>
          </div>
          <button
            className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition"
            type="button"
            onClick={handleNew}
          >
            <Plus size={18} />
            Новая категория
          </button>
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary">Дерево категорий</h2>
              <span className="text-text-secondary text-sm font-bold">{categories.length}</span>
            </div>
            <button
              className="border-border text-text-secondary hover:bg-bg-hover mt-4 flex w-full items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-bold transition"
              type="button"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropOnCategory(null)}
            >
              <FolderTree size={18} />
              Перенести в корень
            </button>
            <div className="mt-4 space-y-2">
              {categoryTree.length > 0 ? (
                categoryTree.map((category) => (
                  <CategoryTreeNode
                    category={category}
                    editingCategoryId={editingCategory?.id ?? null}
                    isPending={isPending}
                    key={category.id}
                    onDragStart={setDraggedCategoryId}
                    onDropOnCategory={handleDropOnCategory}
                    onEdit={handleEdit}
                    onMoveWithinParent={handleMoveWithinParent}
                  />
                ))
              ) : (
                <p className="text-text-secondary rounded-lg bg-bg-secondary p-4 text-sm">
                  Категории не найдены.
                </p>
              )}
            </div>
          </section>

          <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
            <h2 className="text-xl font-bold text-text-primary">Список категорий</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                  <tr>
                    <TableHeader>Название</TableHeader>
                    <TableHeader>Slug</TableHeader>
                    <TableHeader>Товары</TableHeader>
                    <TableHeader>Статус</TableHeader>
                    <TableHeader />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr className="border-border border-t" key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.products_count}</TableCell>
                      <TableCell>
                        <span
                          className={
                            category.is_active
                              ? "rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-success"
                              : "rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-error"
                          }
                        >
                          {category.is_active ? "Активна" : "Неактивна"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition"
                          type="button"
                          onClick={() => handleEdit(category.id)}
                          aria-label={`Редактировать ${category.name}`}
                        >
                          <Edit size={17} />
                        </button>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <CategoryForm
          categories={categories}
          editingCategory={editingCategory}
          isPending={isPending}
          selectedImage={selectedImage}
          onDelete={handleDelete}
          onDeleteImage={handleDeleteImage}
          onImageChange={setSelectedImage}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
};

interface CategoryTreeNodeProps {
  category: CategoryTreeItem;
  editingCategoryId: number | null;
  isPending: boolean;
  onDragStart: (categoryId: number) => void;
  onDropOnCategory: (categoryId: number) => void;
  onEdit: (categoryId: number) => void;
  onMoveWithinParent: (categoryId: number, direction: "up" | "down") => void;
}

const CategoryTreeNode = ({
  category,
  editingCategoryId,
  isPending,
  onDragStart,
  onDropOnCategory,
  onEdit,
  onMoveWithinParent,
}: CategoryTreeNodeProps) => {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-border bg-bg-primary flex items-center justify-between gap-3 rounded-lg border p-3 transition",
          editingCategoryId === category.id && "border-accent-primary bg-bg-hover",
        )}
        draggable
        onDragStart={() => onDragStart(category.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => onDropOnCategory(category.id)}
      >
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          type="button"
          onClick={() => onEdit(category.id)}
        >
          <GripVertical className="text-text-muted shrink-0" size={18} />
          <span className="min-w-0">
            <span className="block truncate font-bold">{category.name}</span>
            <span className="text-text-muted block truncate text-xs">{category.slug}</span>
          </span>
        </button>
        <div className="flex gap-2">
          <IconButton disabled={isPending} label="Выше" onClick={() => onMoveWithinParent(category.id, "up")}>
            <ArrowUp size={16} />
          </IconButton>
          <IconButton disabled={isPending} label="Ниже" onClick={() => onMoveWithinParent(category.id, "down")}>
            <ArrowDown size={16} />
          </IconButton>
        </div>
      </div>
      {category.children.length > 0 ? (
        <div className="border-border ml-4 space-y-2 border-l pl-3">
          {category.children.map((childCategory) => (
            <CategoryTreeNode
              category={childCategory}
              editingCategoryId={editingCategoryId}
              isPending={isPending}
              key={childCategory.id}
              onDragStart={onDragStart}
              onDropOnCategory={onDropOnCategory}
              onEdit={onEdit}
              onMoveWithinParent={onMoveWithinParent}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface CategoryFormProps {
  categories: AdminCategoryListItemResponse[];
  editingCategory: AdminCategoryDetailResponse | null;
  isPending: boolean;
  selectedImage: File | null;
  onDelete: () => void;
  onDeleteImage: () => void;
  onImageChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const CategoryForm = ({
  categories,
  editingCategory,
  isPending,
  selectedImage,
  onDelete,
  onDeleteImage,
  onImageChange,
  onSubmit,
}: CategoryFormProps) => {
  return (
    <form
      className="border-border bg-bg-primary h-fit rounded-lg border p-5 shadow-soft sm:p-6"
      key={editingCategory?.id ?? "new-category"}
      onSubmit={onSubmit}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            {editingCategory ? "Редактирование" : "Создание"}
          </h2>
          <p className="text-text-secondary mt-1 text-sm">
            {editingCategory ? `ID ${editingCategory.id}` : "Новая категория"}
          </p>
        </div>
        {editingCategory ? (
          <button
            className="border-border text-error hover:bg-red-50 inline-flex size-10 items-center justify-center rounded-lg border transition"
            type="button"
            disabled={isPending}
            onClick={onDelete}
            aria-label="Удалить категорию"
          >
            <Trash2 size={17} />
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        <FormField label="Название" required>
          <TextInput defaultValue={editingCategory?.name ?? ""} name="name" />
        </FormField>
        <FormField label="Slug" required>
          <TextInput defaultValue={editingCategory?.slug ?? ""} name="slug" />
        </FormField>
        <FormField label="Родитель">
          <select
            className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-bg-primary px-3 text-sm outline-none transition"
            defaultValue={editingCategory?.parent_id ?? ""}
            name="parent_id"
          >
            <option value="">Корень</option>
            {categories
              .filter((category) => category.id !== editingCategory?.id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </FormField>
        <FormField label="Sort order" required>
          <TextInput
            defaultValue={String(editingCategory?.sort_order ?? categories.length)}
            inputMode="numeric"
            name="sort_order"
          />
        </FormField>
        <FormField label="Описание">
          <textarea
            className="border-border focus:border-accent-primary min-h-24 w-full rounded-lg border bg-transparent px-3 py-3 text-sm outline-none transition placeholder:text-text-muted"
            defaultValue={editingCategory?.description ?? ""}
            name="description"
          />
        </FormField>
        <div className="rounded-lg bg-bg-secondary px-4 py-3">
          <label className="flex items-center justify-between gap-4">
            <span className="font-bold">Активность</span>
            <input
              className="size-5 rounded accent-[var(--color-accent-primary)]"
              defaultChecked={editingCategory?.is_active ?? true}
              name="is_active"
              type="checkbox"
              value="true"
            />
          </label>
        </div>
        <FormField label="Meta title">
          <TextInput defaultValue={editingCategory?.seo?.meta_title ?? ""} name="meta_title" />
        </FormField>
        <FormField label="Meta description">
          <TextInput
            defaultValue={editingCategory?.seo?.meta_description ?? ""}
            name="meta_description"
          />
        </FormField>

        <div>
          <span className="mb-2 block text-sm font-bold">Изображение</span>
          {editingCategory?.image_url ? (
            <div className="mb-3">
              <div
                className="h-36 rounded-lg bg-bg-secondary bg-cover bg-center"
                style={{ backgroundImage: `url(${editingCategory.image_url})` }}
              />
              <button
                className="text-text-secondary hover:text-error mt-2 inline-flex items-center gap-2 text-sm font-bold transition"
                type="button"
                disabled={isPending}
                onClick={onDeleteImage}
              >
                <X size={16} />
                Удалить изображение
              </button>
            </div>
          ) : null}
          <label className="border-border hover:bg-bg-hover flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition">
            <ImagePlus className="text-accent-primary" size={24} />
            <span className="mt-2 text-sm font-bold">
              {selectedImage ? selectedImage.name : "Загрузить изображение"}
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      <button
        className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:cursor-wait disabled:opacity-65"
        type="submit"
        disabled={isPending}
      >
        <Save size={18} />
        {isPending ? "Сохраняем..." : "Сохранить"}
      </button>
    </form>
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

const TableHeader = ({ children }: { children?: React.ReactNode }) => {
  return <th className="px-4 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: React.ReactNode }) => {
  return <td className="px-4 py-4 text-sm">{children}</td>;
};

const buildPayload = (formData: FormData): AdminCategoryPayload => {
  const parentId = Number(getOptionalString(formData, "parent_id"));
  const metaTitle = getOptionalString(formData, "meta_title");
  const metaDescription = getOptionalString(formData, "meta_description");

  const payload: AdminCategoryPayload = {
    description: getOptionalString(formData, "description"),
    is_active: formData.get("is_active") === "true",
    name: getRequiredString(formData, "name"),
    parent_id: Number.isInteger(parentId) && parentId > 0 ? parentId : null,
    slug: getRequiredString(formData, "slug"),
    sort_order: Number(getRequiredString(formData, "sort_order")) || 0,
  };

  if (metaTitle || metaDescription) {
    payload.seo = {
      meta_description: metaDescription,
      meta_title: metaTitle,
    };
  }

  return payload;
};

const validatePayload = (payload: AdminCategoryPayload): string | null => {
  if (payload.name.length < 2) {
    return "Введите название категории.";
  }

  if (payload.slug.length < 2) {
    return "Введите slug категории.";
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

const upsertListCategory = (
  categories: AdminCategoryListItemResponse[],
  detail: AdminCategoryDetailResponse,
): AdminCategoryListItemResponse[] => {
  const nextCategory: AdminCategoryListItemResponse = {
    created_at: detail.created_at ?? new Date().toISOString(),
    id: detail.id,
    image_url: detail.image_url ?? null,
    is_active: detail.is_active,
    is_deleted: false,
    name: detail.name,
    parent_id: detail.parent_id ?? null,
    products_count: detail.products_count ?? 0,
    slug: detail.slug,
    sort_order: detail.sort_order,
  };
  const exists = categories.some((category) => category.id === detail.id);

  return sortCategories(
    exists
      ? categories.map((category) => (category.id === detail.id ? nextCategory : category))
      : [...categories, nextCategory],
  );
};

const buildCategoryTree = (categories: AdminCategoryListItemResponse[]): CategoryTreeItem[] => {
  const categoryMap = new Map<number, CategoryTreeItem>();

  sortCategories(categories).forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  const roots: CategoryTreeItem[] = [];

  categoryMap.forEach((category) => {
    const parentId = category.parent_id ?? null;
    const parent = parentId ? categoryMap.get(parentId) : null;

    if (parent) {
      parent.children.push(category);
      return;
    }

    roots.push(category);
  });

  return roots;
};

const sortCategories = <TCategory extends { sort_order: number; name: string }>(
  categories: TCategory[],
): TCategory[] => {
  return [...categories].sort((firstCategory, secondCategory) => {
    if (firstCategory.sort_order !== secondCategory.sort_order) {
      return firstCategory.sort_order - secondCategory.sort_order;
    }

    return firstCategory.name.localeCompare(secondCategory.name, "ru");
  });
};

const normalizeSortOrders = (
  categories: AdminCategoryListItemResponse[],
): AdminCategoryListItemResponse[] => {
  const groupedCategories = new Map<number | null, AdminCategoryListItemResponse[]>();

  categories.forEach((category) => {
    const parentId = category.parent_id ?? null;
    groupedCategories.set(parentId, [...(groupedCategories.get(parentId) ?? []), category]);
  });

  return categories.map((category) => {
    const siblings = sortCategories(groupedCategories.get(category.parent_id ?? null) ?? []);
    const sortOrder = siblings.findIndex((sibling) => sibling.id === category.id);

    return {
      ...category,
      sort_order: sortOrder >= 0 ? sortOrder : category.sort_order,
    };
  });
};

const toSortPayload = (categories: AdminCategoryListItemResponse[]): AdminCategorySortPayload => {
  return {
    items: categories.map((category) => ({
      id: category.id,
      parent_id: category.parent_id ?? null,
      sort_order: category.sort_order,
    })),
  };
};

const isDescendant = (
  categories: AdminCategoryListItemResponse[],
  parentId: number,
  childId: number,
): boolean => {
  const child = categories.find((category) => category.id === childId);

  if (!child?.parent_id) {
    return false;
  }

  if (child.parent_id === parentId) {
    return true;
  }

  return isDescendant(categories, parentId, child.parent_id);
};
