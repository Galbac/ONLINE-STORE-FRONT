"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Apple,
  Beef,
  ChevronDown,
  Cookie,
  Fish,
  Leaf,
  Milk,
  RotateCcw,
  ShoppingBag,
  Wheat,
} from "lucide-react";
import type { CategoryShortResponse } from "@/entities/category";
import { ROUTES } from "@/shared/config";
import { buildCatalogHref, type CatalogUrlParams } from "@/widgets/catalog/lib/catalogUrl";
import { CatalogPriceFilter } from "@/widgets/catalog/ui/CatalogPriceFilter";

export interface CatalogSidebarProps {
  categories: CategoryShortResponse[];
  currentCategoryId?: number | undefined;
  currentParams: CatalogUrlParams;
  hasDiscount: boolean;
  inStock: boolean;
  isHalal?: boolean | undefined;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  sliderMax: number;
}

export const CatalogSidebar = ({
  categories,
  currentCategoryId,
  currentParams,
  hasDiscount,
  inStock,
  isHalal,
  maxPrice,
  minPrice,
  sliderMax,
}: CatalogSidebarProps) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  const halalActive = isHalal || currentParams.tag === "halal";

  return (
    <aside className="w-full space-y-4">
      {/* 1. Аккордеон категорий со счетчиками */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <button
          type="button"
          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          className="flex w-full items-center justify-between text-sm font-bold text-slate-900 cursor-pointer"
        >
          <span>Категории товаров</span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform duration-200 ${
              isCategoriesOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isCategoriesOpen && (
          <ul className="mt-3.5 space-y-1 max-h-[380px] overflow-y-auto pr-1 text-xs">
            <li>
              <Link
                href={buildCatalogHref({
                  ...currentParams,
                  category_id: undefined,
                  page: undefined,
                })}
                className={`flex items-center justify-between rounded-xl px-2.5 py-2 font-medium transition ${
                  !currentCategoryId
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                }`}
              >
                <span>Все категории</span>
                <span className="text-slate-400">
                  {categories.reduce((acc, c) => acc + (c.products_count ?? 0), 0)}
                </span>
              </Link>
            </li>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isActive = currentCategoryId === cat.id;

              return (
                <li key={cat.id}>
                  <Link
                    href={buildCatalogHref({
                      ...currentParams,
                      category_id: String(cat.id),
                      page: undefined,
                    })}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-2 font-medium transition ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon size={16} className={isActive ? "text-emerald-700" : "text-slate-400"} />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-slate-400 shrink-0 font-mono text-[11px]">
                      {cat.products_count ?? 0}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 2. Компактный блок диапазона цен с двумя инпутами и плавным слайдером цен */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h3 className="mb-3.5 text-sm font-bold text-slate-900">Цена, ₽</h3>
        <CatalogPriceFilter
          currentParams={currentParams}
          maxPrice={maxPrice}
          minPrice={minPrice}
          sliderMax={sliderMax}
        />
      </div>

      {/* 3. Чекбоксы / быстрые переключатели: «Только в наличии», «Товары со скидкой», «Халяль» */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Параметры</h3>

        {/* Только в наличии */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-xs font-bold text-slate-800">Только в наличии</span>
            <span className="text-[11px] text-slate-400">Скрыть недоступные</span>
          </div>
          <Link
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              inStock ? "bg-emerald-600" : "bg-slate-200"
            }`}
            href={buildCatalogHref({
              ...currentParams,
              in_stock: inStock ? "false" : "true",
              page: undefined,
            })}
            aria-label="Фильтр: только в наличии"
          >
            <span
              className={`absolute top-0.5 grid size-5 place-items-center rounded-full bg-white shadow-xs transition-transform ${
                inStock ? "right-0.5" : "left-0.5"
              }`}
            />
          </Link>
        </div>

        {/* Товары со скидкой */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div>
            <span className="block text-xs font-bold text-slate-800">Товары со скидкой</span>
            <span className="text-[11px] text-slate-400">Только акции %</span>
          </div>
          <Link
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              hasDiscount ? "bg-emerald-600" : "bg-slate-200"
            }`}
            href={buildCatalogHref({
              ...currentParams,
              has_discount: hasDiscount ? undefined : "true",
              page: undefined,
            })}
            aria-label="Фильтр: товары со скидкой"
          >
            <span
              className={`absolute top-0.5 grid size-5 place-items-center rounded-full bg-white shadow-xs transition-transform ${
                hasDiscount ? "right-0.5" : "left-0.5"
              }`}
            />
          </Link>
        </div>

        {/* Халяль */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div>
            <span className="block text-xs font-bold text-slate-800">🥩 Халяль</span>
            <span className="text-[11px] text-slate-400">Сертифицированное мясо</span>
          </div>
          <Link
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              halalActive ? "bg-emerald-600" : "bg-slate-200"
            }`}
            href={buildCatalogHref({
              ...currentParams,
              tag: halalActive ? undefined : "halal",
              page: undefined,
            })}
            aria-label="Фильтр: халяль"
          >
            <span
              className={`absolute top-0.5 grid size-5 place-items-center rounded-full bg-white shadow-xs transition-transform ${
                halalActive ? "right-0.5" : "left-0.5"
              }`}
            />
          </Link>
        </div>
      </div>

      {/* Кнопка сброса всех фильтров */}
      <Link
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-emerald-700 active:scale-95"
        href={ROUTES.CATALOG}
      >
        <RotateCcw size={15} />
        Сбросить все фильтры
      </Link>
    </aside>
  );
};

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("мясо") || lower.includes("птиц") || lower.includes("колбас")) return Beef;
  if (lower.includes("рыб") || lower.includes("морепродукт")) return Fish;
  if (lower.includes("овощ") || lower.includes("зелен")) return Leaf;
  if (lower.includes("фрукт") || lower.includes("ягод")) return Apple;
  if (lower.includes("молок") || lower.includes("сыр") || lower.includes("творог")) return Milk;
  if (lower.includes("хлеб") || lower.includes("выпечк") || lower.includes("круп")) return Wheat;
  if (lower.includes("слад") || lower.includes("конфет")) return Cookie;
  return ShoppingBag;
}
