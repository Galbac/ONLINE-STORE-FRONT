"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, MapPin, Store, XCircle } from "lucide-react";
import { useStoreBranch } from "@/entities/delivery";
import type { StoreStockResponse } from "@/entities/product";

interface ProductStoresStockProps {
  storesStock?: StoreStockResponse[] | undefined;
  unit: string;
}

export const ProductStoresStock = ({ storesStock, unit }: ProductStoresStockProps) => {
  const { selectedStore } = useStoreBranch();
  const [isOpen, setIsOpen] = useState(false);

  if (!storesStock || storesStock.length === 0) {
    return null;
  }

  // Find stock in currently selected store
  const currentStoreStock = selectedStore
    ? storesStock.find((s) => s.store_id === selectedStore.id)
    : null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs text-slate-700 transition-all">
      {/* Selected store status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store size={15} className="text-emerald-600 shrink-0" />
          <div>
            <span className="font-medium text-slate-900">
              {selectedStore ? selectedStore.name : "Ваш магазин"}:
            </span>{" "}
            {currentStoreStock ? (
              currentStoreStock.is_available ? (
                <span className="text-emerald-600 font-semibold">
                  В наличии ({Number(currentStoreStock.stock_quantity)} {unit})
                </span>
              ) : (
                <span className="text-rose-500 font-semibold">Нет в наличии</span>
              )
            ) : (
              <span className="text-slate-500">{selectedStore ? "Нет в наличии в этом магазине" : "Выберите магазин"}</span>
            )}
          </div>
        </div>

        {storesStock.length > 1 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer select-none"
          >
            <span>Все филиалы ({storesStock.length})</span>
            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Accordion with all stores */}
      {isOpen && storesStock.length > 1 && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2 animate-in fade-in-50 duration-150">
          {storesStock.map((s) => (
            <div
              key={s.store_id}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                selectedStore?.id === s.store_id
                  ? "bg-emerald-50/80 font-medium text-slate-900"
                  : "hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span>{s.store_name} ({s.address})</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {s.is_available ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 size={12} />
                    {Number(s.stock_quantity)} {unit}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <XCircle size={12} />
                    Нет
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
