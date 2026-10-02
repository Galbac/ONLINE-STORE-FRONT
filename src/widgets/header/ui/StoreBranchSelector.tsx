"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, ChevronDown, Clock, MapPin, Phone, Search, Store, X } from "lucide-react";
import { deliveryApi, useStoreBranch, type PickupPointResponse } from "@/entities/delivery";
import { formatPhoneMask } from "@/shared/lib/format/phone";

export const StoreBranchSelector = () => {
  const { selectedStore, setSelectedStore } = useStoreBranch();
  const [isOpen, setIsOpen] = useState(false);
  const [stores, setStores] = useState<PickupPointResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadStores = async () => {
      try {
        setIsLoading(true);
        const res = await deliveryApi.getPickupPoints({ only_active: true });
        if (isMounted && res.items) {
          setStores(res.items);
          // If no store selected yet, pick the first one by default
          const firstStore = res.items[0];
          if (!selectedStore && firstStore) {
            setSelectedStore(firstStore);
          }
        }
      } catch (err) {
        console.error("Failed to load pickup points:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadStores();
    return () => {
      isMounted = false;
    };
  }, [selectedStore, setSelectedStore]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q),
    );
  }, [stores, searchQuery]);

  const handleSelectStore = (store: PickupPointResponse) => {
    setSelectedStore(store);
    setIsOpen(false);
  };

  const displayText = selectedStore
    ? selectedStore.name || selectedStore.address
    : "Выбрать магазин";

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200/60"
        title="Сменить филиал магазина"
      >
        <Store size={13} className="text-emerald-600 shrink-0 group-hover:scale-105 transition-transform" />
        <span className="max-w-[140px] sm:max-w-[180px] truncate font-medium">{displayText}</span>
        <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          <div
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Store size={18} className="text-emerald-600" />
                  Выберите магазин
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Наличие товаров и время самовывоза зависят от выбранного филиала
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="pt-4 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск магазина по названию или адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Store List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 my-2">
              {isLoading && stores.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Загрузка списка магазинов...</div>
              ) : filteredStores.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Магазины не найдены</div>
              ) : (
                filteredStores.map((store) => {
                  const isCurrent = selectedStore?.id === store.id;
                  return (
                    <div
                      key={store.id}
                      onClick={() => handleSelectStore(store)}
                      className={`group p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isCurrent
                          ? "border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/30"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">{store.name}</span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                <Check size={11} />
                                Выбран
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span>{store.city}, {store.address}</span>
                          </div>
                          {store.working_hours && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock size={12} className="text-slate-400 shrink-0" />
                              <span>Режим: {store.working_hours}</span>
                            </div>
                          )}
                          {store.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{formatPhoneMask(store.phone)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
