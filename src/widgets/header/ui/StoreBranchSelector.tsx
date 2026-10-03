"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Clock, MapPin, Phone, Search, Store, X } from "lucide-react";
import { deliveryApi, useStoreBranch, type PickupPointResponse } from "@/entities/delivery";
import { formatPhoneMask } from "@/shared/lib/format/phone";

export const StoreBranchSelector = () => {
  const router = useRouter();
  const { selectedStore, setSelectedStore } = useStoreBranch();
  const [isOpen, setIsOpen] = useState(false);
  const [stores, setStores] = useState<PickupPointResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStores = async () => {
      try {
        setIsLoading(true);
        const res = await deliveryApi.getPickupPoints({ only_active: true });
        if (isMounted && res.items) {
          setStores(res.items);
          if (!selectedStore && res.items[0]) {
            setSelectedStore(res.items[0]);
            router.refresh();
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
  }, [selectedStore, setSelectedStore, router]);

  // Закрытие по клику вне контейнера
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Закрытие по Escape
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
    router.refresh();
  };

  const displayText = selectedStore
    ? selectedStore.name || selectedStore.address
    : "Выбрать магазин";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Кнопка открытия списка филиалов */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-all cursor-pointer border border-slate-200/90 shadow-2xs"
        title="Выбрать филиал магазина"
        aria-expanded={isOpen}
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
          <Store size={12} />
        </span>
        <span className="max-w-[140px] sm:max-w-[190px] truncate">{displayText}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 group-hover:text-emerald-600 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Выпадающий список филиалов (эстетичный поповер) */}
      {isOpen && (
        <>
          {/* Полупрозрачный оверлей для мобильных */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs sm:hidden animate-in fade-in-0 duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3 bottom-4 z-50 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-[380px] max-h-[80vh] sm:max-h-[500px] flex flex-col rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-md p-4 shadow-2xl shadow-slate-900/15 animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Шапка выпадающего списка */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Store size={16} />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Филиалы магазина
                  </h4>
                  <p className="text-[11px] text-slate-400">Остатки зависят от филиала, цены единые</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            {/* Поиск по филиалам, если их больше 2 */}
            {stores.length > 2 && (
              <div className="pt-3 pb-1">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск филиала по адресу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Список адресов филиалов */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-0.5 mt-1">
              {isLoading && stores.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Загрузка списка адресов...</div>
              ) : filteredStores.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Адреса не найдены</div>
              ) : (
                filteredStores.map((store) => {
                  const isCurrent = selectedStore?.id === store.id;
                  return (
                    <div
                      key={store.id}
                      onClick={() => handleSelectStore(store)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? "border-emerald-500 bg-emerald-50/60 shadow-2xs ring-1 ring-emerald-500/20"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {store.name}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                                <Check size={10} />
                                Выбран
                              </span>
                            )}
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-slate-600">
                            <MapPin size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                            <span className="leading-tight">{store.city}, {store.address}</span>
                          </div>
                          {store.working_hours && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Clock size={11} className="shrink-0" />
                              <span>{store.working_hours}</span>
                            </div>
                          )}
                          {store.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Phone size={11} className="shrink-0" />
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
          </div>
        </>
      )}
    </div>
  );
};
