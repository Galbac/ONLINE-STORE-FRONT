import Link from "next/link";
import { Edit, PackagePlus, Search } from "lucide-react";
import type { AdminCategoryListResponse } from "@/entities/admin-category";
import type { AdminLowStockResponse } from "@/entities/admin-dashboard";
import type { AdminProductListItemResponse, AdminProductListResponse } from "@/entities/admin-product";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

export interface AdminProductFilters {
  category_id: string;
  in_stock: string;
  is_active: string;
  is_available: string;
  page: string;
  q: string;
  sync_status: string;
}

interface AdminProductsViewProps {
  categories: AdminCategoryListResponse;
  filters: AdminProductFilters;
  lowStock: AdminLowStockResponse;
  products: AdminProductListResponse;
}

export const AdminProductsView = ({
  categories,
  filters,
  lowStock,
  products,
}: AdminProductsViewProps) => {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Товары</h1>
          <p className="text-text-secondary mt-2">
            Каталог, остатки, доступность и статусы синхронизации.
          </p>
        </div>
        <Link
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_PRODUCT_CREATE}
        >
          <PackagePlus size={18} />
          Создать товар
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Всего найдено" value={products.total.toLocaleString("ru-RU")} />
        <SummaryCard label="Низкий остаток" value={lowStock.total.toLocaleString("ru-RU")} />
        <SummaryCard label="Категории" value={categories.total.toLocaleString("ru-RU")} />
      </section>

      <ProductsFilters categories={categories} filters={filters} />

      <section className="border-border bg-bg-primary overflow-hidden rounded-lg border shadow-soft">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-bold text-text-primary">Список товаров</h2>
            <p className="text-text-secondary mt-1 text-sm">
              Страница {products.page} из {products.pages || 1}
            </p>
          </div>
          <span className="text-text-secondary text-sm font-bold">
            {products.items.length} из {products.total}
          </span>
        </div>

        {products.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Товар</TableHeader>
                  <TableHeader>Категория</TableHeader>
                  <TableHeader>Цена</TableHeader>
                  <TableHeader>Остаток</TableHeader>
                  <TableHeader>Активность</TableHeader>
                  <TableHeader>Наличие</TableHeader>
                  <TableHeader>sync_status</TableHeader>
                  <TableHeader />
                </tr>
              </thead>
              <tbody>
                {products.items.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">По выбранным фильтрам товары не найдены.</p>
        )}

        <Pagination filters={filters} products={products} />
      </section>

      {lowStock.items.length > 0 ? (
        <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft">
          <h2 className="text-xl font-bold text-text-primary">Требуют пополнения</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lowStock.items.map((product) => (
              <div className="border-border rounded-lg border p-4" key={product.id}>
                <p className="truncate font-bold text-text-primary">{product.name}</p>
                <p className="text-text-muted mt-1 text-sm">{product.sku ?? product.product_type}</p>
                <p className="mt-3 text-sm font-bold text-error">
                  {formatQuantity(product.stock_quantity)} {product.unit}
                  <span className="text-text-muted font-normal">
                    {" "}
                    / порог {formatQuantity(product.low_stock_threshold)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <article className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
    </article>
  );
};

const ProductsFilters = ({
  categories,
  filters,
}: {
  categories: AdminCategoryListResponse;
  filters: AdminProductFilters;
}) => {
  return (
    <form className="border-border bg-bg-primary rounded-lg border p-4 shadow-soft" method="get">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="xl:col-span-2">
          <span className="mb-2 block text-sm font-bold">Поиск</span>
          <span className="border-border focus-within:border-accent-primary flex h-11 items-center gap-2 rounded-lg border px-3 transition">
            <Search className="text-text-muted shrink-0" size={18} />
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              defaultValue={filters.q}
              name="q"
              placeholder="Название, SKU, barcode"
              type="search"
            />
          </span>
        </label>

        <FilterSelect defaultValue={filters.category_id} label="Категория" name="category_id">
          <option value="">Все</option>
          {categories.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect defaultValue={filters.is_active} label="Активность" name="is_active">
          <option value="">Все</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </FilterSelect>

        <FilterSelect defaultValue={filters.in_stock} label="В наличии" name="in_stock">
          <option value="">Все</option>
          <option value="true">Есть остаток</option>
          <option value="false">Нет остатка</option>
        </FilterSelect>

        <label>
          <span className="mb-2 block text-sm font-bold">sync_status</span>
          <input
            className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition placeholder:text-text-muted"
            defaultValue={filters.sync_status}
            name="sync_status"
            placeholder="Статус"
            type="text"
          />
        </label>
      </div>

      <input name="page" type="hidden" value="1" />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover h-11 rounded-lg px-4 text-sm font-bold transition"
          type="submit"
        >
          Применить
        </button>
        <Link
          className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_PRODUCTS}
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
};

interface FilterSelectProps {
  children: React.ReactNode;
  defaultValue: string;
  label: string;
  name: string;
}

const FilterSelect = ({ children, defaultValue, label, name }: FilterSelectProps) => {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <select
        className="border-border focus:border-accent-primary h-11 w-full rounded-lg border bg-bg-primary px-3 text-sm outline-none transition"
        defaultValue={defaultValue}
        name={name}
      >
        {children}
      </select>
    </label>
  );
};

const ProductRow = ({ product }: { product: AdminProductListItemResponse }) => {
  const isLowStock = Number(product.stock_quantity) <= Number(product.low_stock_threshold);

  return (
    <tr className="border-border border-t align-top">
      <TableCell>
        <div className="min-w-0">
          <Link
            className="hover:text-accent-primary block max-w-[280px] truncate font-bold transition"
            href={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}
          >
            {product.name}
          </Link>
          <p className="text-text-muted mt-1 text-xs">
            SKU: {product.sku ?? "-"} · Barcode: {product.barcode ?? "-"}
          </p>
        </div>
      </TableCell>
      <TableCell>{product.category?.name ?? "-"}</TableCell>
      <TableCell>{toPriceFormat(product.price)}</TableCell>
      <TableCell>
        <span className={isLowStock ? "font-bold text-error" : "text-text-primary"}>
          {formatQuantity(product.stock_quantity)} {product.unit}
        </span>
        <p className="text-text-muted mt-1 text-xs">порог {formatQuantity(product.low_stock_threshold)}</p>
      </TableCell>
      <TableCell>
        <StatusPill active={product.is_active} falseLabel="Неактивен" trueLabel="Активен" />
      </TableCell>
      <TableCell>
        <StatusPill active={product.is_available} falseLabel="Недоступен" trueLabel="Доступен" />
      </TableCell>
      <TableCell>{product.sync_status ?? "-"}</TableCell>
      <TableCell>
        <Link
          className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition"
          href={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}
          aria-label={`Редактировать ${product.name}`}
        >
          <Edit size={17} />
        </Link>
      </TableCell>
    </tr>
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
          ? "inline-flex rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-success"
          : "inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-error"
      }
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
};

const Pagination = ({
  filters,
  products,
}: {
  filters: AdminProductFilters;
  products: AdminProductListResponse;
}) => {
  const previousPage = Math.max(products.page - 1, 1);
  const nextPage = Math.min(products.page + 1, products.pages || 1);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
      <p className="text-text-secondary text-sm">
        {products.total > 0
          ? `${(products.page - 1) * products.limit + 1}-${Math.min(
              products.page * products.limit,
              products.total,
            )} из ${products.total}`
          : "0 из 0"}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          disabled={products.page <= 1}
          href={createProductsHref(filters, previousPage)}
          label="Назад"
        />
        <PaginationLink
          disabled={products.page >= products.pages}
          href={createProductsHref(filters, nextPage)}
          label="Вперед"
        />
      </div>
    </div>
  );
};

const PaginationLink = ({
  disabled,
  href,
  label,
}: {
  disabled: boolean;
  href: string;
  label: string;
}) => {
  if (disabled) {
    return (
      <span className="border-border text-text-muted inline-flex h-10 items-center rounded-lg border px-3 text-sm font-bold opacity-60">
        {label}
      </span>
    );
  }

  return (
    <Link
      className="border-border hover:bg-bg-hover inline-flex h-10 items-center rounded-lg border px-3 text-sm font-bold transition"
      href={href}
    >
      {label}
    </Link>
  );
};

const TableHeader = ({ children }: { children?: React.ReactNode }) => {
  return <th className="px-4 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: React.ReactNode }) => {
  return <td className="px-4 py-4 text-sm">{children}</td>;
};

const createProductsHref = (filters: AdminProductFilters, page: number): string => {
  const params = new URLSearchParams();

  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${ROUTES.ADMIN_PRODUCTS}?${query}` : ROUTES.ADMIN_PRODUCTS;
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
