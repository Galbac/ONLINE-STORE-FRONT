"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import type { CategoryShortResponse } from "@/entities/category";
import { buildCatalogHref, type CatalogUrlParams } from "@/widgets/catalog/lib/catalogUrl";
import { CatalogSidebar } from "./CatalogSidebar";
import { formatProductsCount } from "@/utils/pluralize";

export interface CatalogControlsProps {
  categories: CategoryShortResponse[];
  currentParams: CatalogUrlParams;
  currentSort: string;
  hasDiscount: boolean;
  inStock: boolean;
  isHalal?: boolean | undefined;
  maxPrice?: string | undefined;
  minPrice?: string | undefined;
  productsTotal: number;
  sliderMax: number;
}

const SORT_OPTIONS = [
  { label: "По популярности", value: "popular" },
  { label: "Сначала новинки", value: "newest" },
  { label: "Сначала дешевле", value: "price_asc" },
  { label: "Сначала дороже", value: "price_desc" },
  { label: "По названию", value: "name_asc" },
];

export const CatalogControls = ({
  categories,
  currentParams,
  currentSort,
  hasDiscount,
  inStock,
  isHalal,
  maxPrice,
  minPrice,
  productsTotal,
  sliderMax,
}: CatalogControlsProps) => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Подсчет активных фильтров
  let activeFiltersCount = 0;
  if (currentParams.category_id) activeFiltersCount++;
  if (hasDiscount) activeFiltersCount++;
  if (!inStock) activeFiltersCount++; // нестандартное состояние наличия
  if (isHalal || currentParams.tag === "halal") activeFiltersCount++;
  if (minPrice || maxPrice) activeFiltersCount++;

  // Блокировка скролла при открытом Bottom Sheet
  useEffect(() => {
    if (isSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSheetOpen]);

  const handleSortChange = (newSort: string) => {
    const nextHref = buildCatalogHref({
      ...currentParams,
      sort: (newSort as CatalogUrlParams["sort"]) || undefined,
      page: undefined,
    });
    router.push(nextHref);
  };

  return (
    <>
      {/* Мобильная панель фильтров и сортировки (sticky над товарами) */}
      <div className="lg:hidden sticky top-[56px] sm:top-[64px] z-20 -mx-4 mb-4 border-y border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          {/* Кнопка «Фильтры» с бейджем */}
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-800 transition active:scale-95 cursor-pointer hover:bg-slate-100"
          >
            <SlidersHorizontal size={15} className="text-emerald-700" />
            <span>Фильтры</span>
            {activeFiltersCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow-xs">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>

          {/* Быстрый селект сортировки */}
          <div className="relative flex-1">
            <select
              aria-label="Сортировка товаров"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 pl-3 pr-8 text-xs font-bold text-slate-800 transition outline-none cursor-pointer focus:border-emerald-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* Строка со счетчиком товаров */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
          <span>Найдено: <strong className="font-bold text-slate-800">{formatProductsCount(productsTotal)}</strong></span>
          {activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={() => router.push("/catalog")}
              className="font-medium text-emerald-700 hover:underline cursor-pointer"
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </div>

      {/* Мобильная шторка фильтров (Bottom Sheet) */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={() => setIsSheetOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative z-10 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-emerald-700" />
                <h3 className="text-base font-extrabold text-slate-900">Фильтры каталога</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                aria-label="Закрыть фильтры"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto py-4">
              <CatalogSidebar
                categories={categories}
                currentCategoryId={currentParams.category_id ? Number(currentParams.category_id) : undefined}
                currentParams={currentParams}
                hasDiscount={hasDiscount}
                inStock={inStock}
                isHalal={isHalal}
                maxPrice={maxPrice}
                minPrice={minPrice}
                sliderMax={sliderMax}
              />
            </div>

            {/* Drawer Footer CTA */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-700/20 active:scale-98 transition cursor-pointer"
              >
                Показать товары ({formatProductsCount(productsTotal)})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
