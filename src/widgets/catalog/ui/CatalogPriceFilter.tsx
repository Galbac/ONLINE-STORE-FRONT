"use client";

import { useMemo, useState } from "react";

import type { CatalogUrlParams } from "../lib/catalogUrl";

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
  const rangeStyle = useMemo(
    () => ({
      left: `${(fromPrice / normalizedSliderMax) * 100}%`,
      right: `${100 - (toPrice / normalizedSliderMax) * 100}%`,
    }),
    [fromPrice, normalizedSliderMax, toPrice],
  );

  const handleFromChange = (value: string): void => {
    const nextPrice = clampPrice(value, MIN_PRICE, toPrice, MIN_PRICE);
    setFromPrice(nextPrice);
  };

  const handleToChange = (value: string): void => {
    const nextPrice = clampPrice(value, fromPrice, normalizedSliderMax, normalizedSliderMax);
    setToPrice(nextPrice);
  };

  return (
    <form className="space-y-4" action="/catalog">
      {currentParams.category_id ? (
        <input name="category_id" type="hidden" value={currentParams.category_id} />
      ) : null}
      {currentParams.in_stock ? (
        <input name="in_stock" type="hidden" value={currentParams.in_stock} />
      ) : null}
      {currentParams.sort ? <input name="sort" type="hidden" value={currentParams.sort} /> : null}

      <div className="grid grid-cols-2 gap-3">
        <label className="sr-only" htmlFor="catalog-min-price">
          Цена от
        </label>
        <input
          className="border-border focus:border-accent-primary h-12 min-w-0 rounded-lg border px-4 text-sm outline-none"
          id="catalog-min-price"
          inputMode="decimal"
          min={MIN_PRICE}
          max={toPrice}
          name={minPrice || fromPrice > MIN_PRICE ? "min_price" : undefined}
          placeholder="от 0"
          type="number"
          value={fromPrice}
          onChange={(event) => handleFromChange(event.target.value)}
        />
        <label className="sr-only" htmlFor="catalog-max-price">
          Цена до
        </label>
        <input
          className="border-border focus:border-accent-primary h-12 min-w-0 rounded-lg border px-4 text-sm outline-none"
          id="catalog-max-price"
          inputMode="decimal"
          min={fromPrice}
          max={normalizedSliderMax}
          name={maxPrice || toPrice < normalizedSliderMax ? "max_price" : undefined}
          placeholder={`до ${normalizedSliderMax}`}
          type="number"
          value={toPrice}
          onChange={(event) => handleToChange(event.target.value)}
        />
      </div>

      <div className="relative h-7">
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
        <span>{MIN_PRICE}</span>
        <span>{Math.round(normalizedSliderMax / 2)}</span>
        <span>{normalizedSliderMax}</span>
      </div>
      <button
        className="bg-accent-primary text-accent-contrast hover:bg-accent-hover h-10 w-full rounded-lg text-sm font-bold transition disabled:opacity-60"
        type="submit"
      >
        Применить
      </button>
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
