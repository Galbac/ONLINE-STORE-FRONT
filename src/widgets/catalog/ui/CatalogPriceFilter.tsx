"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";


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
  sliderMax,
}: CatalogPriceFilterProps) => {
  const router = useRouter();
  const normalizedSliderMax = Math.max(sliderMax, MIN_PRICE + 10);
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      {Object.entries(currentParams).map(([key, value]) => {
        if (!value || key === "min_price" || key === "max_price" || key === "page") {
          return null;
        }
        return <input key={key} name={key} type="hidden" value={value} />;
      })}

      <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
        <div className="text-slate-400 mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
          <SlidersHorizontal size={13} className="text-emerald-600" />
          Диапазон
        </div>
        <div className="text-slate-900 flex items-baseline justify-between gap-3">
          <span className="text-base font-extrabold">{fromPrice.toLocaleString("ru-RU")} ₽</span>
          <span className="text-slate-400 text-xs font-medium">до</span>
          <span className="text-base font-extrabold">{toPrice.toLocaleString("ru-RU")} ₽</span>
        </div>
      </div>

      <div className="relative h-7 flex items-center">
        <div className="bg-slate-200 absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full overflow-hidden">
          <span className="bg-emerald-500 absolute inset-y-0 rounded-full" style={rangeStyle} />
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

      <div className="text-slate-400 flex justify-between text-[11px] font-mono px-0.5">
        <span>{MIN_PRICE} ₽</span>
        <span>{Math.round(normalizedSliderMax / 2).toLocaleString("ru-RU")} ₽</span>
        <span>{normalizedSliderMax.toLocaleString("ru-RU")} ₽</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-slate-500 mb-1 block text-xs font-semibold">От</span>
          <input
            className="border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 h-10 w-full min-w-0 rounded-xl border bg-slate-50/50 px-3 text-xs font-bold text-slate-800 outline-none transition"
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
          <span className="text-slate-500 mb-1 block text-xs font-semibold">До</span>
          <input
            className="border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 h-10 w-full min-w-0 rounded-xl border bg-slate-50/50 px-3 text-xs font-bold text-slate-800 outline-none transition"
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
