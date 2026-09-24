"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { buildCatalogHref } from "../lib/catalogUrl";

export interface CatalogPriceFilterProps {
  action?: string | undefined;
  currentParams: Record<string, string | undefined>;
  maxPrice?: string | undefined;
  minPrice?: string | undefined;
  sliderMax: number;
  resetHref?: string | undefined;
}

const MIN_PRICE = 0;

export const CatalogPriceFilter = ({
  action = "/catalog",
  currentParams,
  maxPrice,
  minPrice,
  resetHref,
  sliderMax,
}: CatalogPriceFilterProps) => {
  const router = useRouter();
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

  const isUserAction = useRef(false);

  useEffect(() => {
    isUserAction.current = false;
    setFromPrice(initialMinPrice);
    setToPrice(normalizedInitialMaxPrice);
  }, [initialMinPrice, normalizedInitialMaxPrice]);

  useEffect(() => {
    if (!isUserAction.current) return;

    const timer = setTimeout(() => {
      isUserAction.current = false;
      const params = new URLSearchParams();
      Object.entries(currentParams).forEach(([k, v]) => {
        if (v && k !== "min_price" && k !== "max_price" && k !== "page") {
          params.set(k, v);
        }
      });
      if (fromPrice > MIN_PRICE) {
        params.set("min_price", String(fromPrice));
      }
      if (toPrice < normalizedSliderMax) {
        params.set("max_price", String(toPrice));
      }
      const query = params.toString();
      router.push(query ? `${action}?${query}` : action, { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [fromPrice, toPrice, action, normalizedSliderMax, currentParams, router]);

  const handleFromChange = (value: string): void => {
    isUserAction.current = true;
    const nextPrice = clampPrice(value, MIN_PRICE, toPrice, MIN_PRICE);
    setFromPrice(nextPrice);
  };

  const handleToChange = (value: string): void => {
    isUserAction.current = true;
    const nextPrice = clampPrice(value, fromPrice, normalizedSliderMax, normalizedSliderMax);
    setToPrice(nextPrice);
  };

  const targetResetHref =
    resetHref ||
    buildCatalogHref({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== "min_price" && k !== "max_price" && k !== "page") {
        params.set(k, v);
      }
    });
    if (fromPrice > MIN_PRICE) {
      params.set("min_price", String(fromPrice));
    }
    if (toPrice < normalizedSliderMax) {
      params.set("max_price", String(toPrice));
    }
    const query = params.toString();
    router.push(query ? `${action}?${query}` : action, { scroll: false });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {Object.entries(currentParams).map(([key, value]) => {
        if (!value || key === "min_price" || key === "max_price" || key === "page") {
          return null;
        }
        return <input key={key} name={key} type="hidden" value={value} />;
      })}

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
        <button
          type="button"
          onClick={() => router.push(targetResetHref, { scroll: false })}
          className="border-border text-text-secondary hover:bg-bg-hover grid size-10 place-items-center rounded-lg border transition cursor-pointer"
          aria-label="Сбросить цену"
        >
          <X size={16} className={hasActivePriceFilter ? "text-rose-500" : undefined} />
        </button>
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
