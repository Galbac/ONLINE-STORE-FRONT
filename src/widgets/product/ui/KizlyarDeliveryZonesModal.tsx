"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Info, Truck, X, Store } from "lucide-react";
import { STORE_INFO } from "@/shared/config";

export const KizlyarDeliveryZonesModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer mt-1"
      >
        <Info size={13} className="text-emerald-600" />
        Подробные тарифы и зоны доставки
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Truck size={18} />
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Зоны и тарифы доставки</h3>
                      <p className="text-xs text-slate-400">г. Кизляр и пригородные районы</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Zone 1 */}
                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                        Зона 1: Центр города
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        от 45 мин
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      ул. Ленина, Багратиона, Советская, Красина, Победы
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-800 border-t border-emerald-200/60 pt-2">
                      <span>Стоимость: 150 ₽</span>
                      <span className="text-emerald-700">Бесплатно от 1 500 ₽</span>
                    </div>
                  </div>

                  {/* Zone 2 */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Зона 2: Районы города
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                        от 60 мин
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Черёмушки, МЖК, Слободка, пос. Южный
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-800 border-t border-slate-200 pt-2">
                      <span>Стоимость: 250 ₽</span>
                      <span className="text-emerald-700">Бесплатно от 2 000 ₽</span>
                    </div>
                  </div>

                  {/* Zone 3 */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Зона 3: Пригород
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                        от 90 мин
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Юбилейное, Комсомольский, Первомайское, Бабаюрт
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-800 border-t border-slate-200 pt-2">
                      <span>Стоимость: 350 ₽</span>
                      <span className="text-emerald-700">Бесплатно от 3 000 ₽</span>
                    </div>
                  </div>

                  {/* Pickup */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-indigo-600" />
                      <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
                        Самовывоз из магазина
                      </span>
                      <span className="ml-auto text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        0 ₽ Бесплатно
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5">
                      {STORE_INFO.address}. Готов к выдаче через 15 минут.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Понятно
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
