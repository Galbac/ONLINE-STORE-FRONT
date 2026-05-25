"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { buildCatalogHref, type CatalogUrlParams } from "../lib/catalogUrl";

interface CatalogPriceFilterProps {
  currentParams: CatalogUrlParams;
  maxPrice?: string | undefined;
  minPrice?: string | undefined;
  sliderMax: number;
}

const MIN_PRICE = 0;

export const CatalogPriceFilter = ({
  currentParams,
  maxPrice,
  minPrice,
  sliderMax,
}: CatalogPriceFilterProps) => {
  const normalizedSliderMax = Math.max(sliderMax, MIN_PRICE + 1);
  const initialMinPrice = clampPrice(minPrice, MIN_PRICE, normalizedSliderMax, MIN_PRICE);
  const initialMaxPrice = clampPrice(
    maxPrice,
    MIN_PRICE,
    normalizedSliderMax,
    normalizedSliderMax,
  );
  const [fromPrice, setFromPrice] = useState(initialMinPrice);
  const [toPrice, setToPrice] = useState(Math.max(initialMaxPrice, initialMinPrice));
  const normalizedInitialMaxPrice = Math.max(initialMaxPrice, initialMinPrice);
  const rangeStyle = useMemo(
    () => ({
      left: `${(fromPrice / normalizedSliderMax) * 100}%`,
      right: `${100 - (toPrice / normalizedSliderMax) * 100}%`,
    }),
    [fromPrice, normalizedSliderMax, toPrice],
  );

  useEffect(() => {
    setFromPrice(initialMinPrice);
    setToPrice(normalizedInitialMaxPrice);
  }, [initialMinPrice, normalizedInitialMaxPrice]);

  const handleFromChange = (value: string): void => {
    const nextPrice = clampPrice(value, MIN_PRICE, toPrice, MIN_PRICE);
    setFromPrice(nextPrice);
  };

  const handleToChange = (value: string): void => {
    const nextPrice = clampPrice(value, fromPrice, normalizedSliderMax, normalizedSliderMax);
    setToPrice(nextPrice);
  };
  const resetHref = buildCatalogHref({
    ...currentParams,
    max_price: undefined,
    min_price: undefined,
    page: undefined,
  });
  const hasActivePriceFilter =
    minPrice !== undefined ||
    maxPrice !== undefined ||
    fromPrice > MIN_PRICE ||
    toPrice < normalizedSliderMax;

  return (
    <form className="space-y-5" action="/catalog">
      {currentParams.category_id ? (
        <input name="category_id" type="hidden" value={currentParams.category_id} />
      ) : null}
      {currentParams.in_stock ? (
        <input name="in_stock" type="hidden" value={currentParams.in_stock} />
      ) : null}
      {currentParams.has_discount ? (
        <input name="has_discount" type="hidden" value={currentParams.has_discount} />
      ) : null}
      {currentParams.sort ? <input name="sort" type="hidden" value={currentParams.sort} /> : null}

      <div className="bg-bg-hover rounded-lg px-4 py-3">
        <div className="text-text-muted mb-1 flex items-center gap-2 text-xs font-bold uppercase">
          <SlidersHorizontal size={14} />
          Диапазон
        </div>
        <div className="text-text-primary flex items-baseline justify-between gap-3">
          <span className="text-lg font-bold">{fromPrice.toLocaleString("ru-RU")} ₽</span>
          <span className="text-text-muted text-xs">до</span>
          <span className="text-lg font-bold">{toPrice.toLocaleString("ru-RU")} ₽</span>
        </div>
      </div>

      <div className="relative h-9">
        <div className="bg-border absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full">
          <span className="bg-accent-primary absolute inset-y-0 rounded-full" style={rangeStyle} />
        </div>
        <input
          className="price-range-input"
          min={MIN_PRICE}
          max={normalizedSliderMax}
          step="1"
          type="range"
          value={fromPrice}
          onChange={(event) => handleFromChange(event.target.value)}
          aria-label="Минимальная цена"
        />
        <input
          className="price-range-input"
          min={MIN_PRICE}
          max={normalizedSliderMax}
          step="1"
          type="range"
          value={toPrice}
          onChange={(event) => handleToChange(event.target.value)}
          aria-label="Максимальная цена"
        />
      </div>

      <div className="text-text-muted flex justify-between text-xs">
        <span>{MIN_PRICE} ₽</span>
        <span>{Math.round(normalizedSliderMax / 2).toLocaleString("ru-RU")} ₽</span>
        <span>{normalizedSliderMax.toLocaleString("ru-RU")} ₽</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-text-muted mb-2 block text-xs font-bold">От</span>
          <input
            className="border-border focus:border-accent-primary h-11 min-w-0 rounded-lg border px-3 text-sm outline-none"
            inputMode="decimal"
            min={MIN_PRICE}
            max={toPrice}
            name={minPrice || fromPrice > MIN_PRICE ? "min_price" : undefined}
            type="number"
            value={fromPrice}
            onChange={(event) => handleFromChange(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-text-muted mb-2 block text-xs font-bold">До</span>
          <input
            className="border-border focus:border-accent-primary h-11 min-w-0 rounded-lg border px-3 text-sm outline-none"
            inputMode="decimal"
            min={fromPrice}
            max={normalizedSliderMax}
            name={maxPrice || toPrice < normalizedSliderMax ? "max_price" : undefined}
            type="number"
            value={toPrice}
            onChange={(event) => handleToChange(event.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover h-10 rounded-lg text-sm font-bold transition disabled:opacity-60"
          type="submit"
        >
          Показать товары
        </button>
        <a
          className="border-border text-text-secondary hover:bg-bg-hover grid size-10 place-items-center rounded-lg border transition"
          href={resetHref}
          aria-label="Сбросить цену"
        >
          <X size={16} className={hasActivePriceFilter ? "text-error" : undefined} />
        </a>
      </div>
    </form>
  );
};

const clampPrice = (
  value: string | number | undefined,
  min: number,
  max: number,
  fallback: number,
): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
};
