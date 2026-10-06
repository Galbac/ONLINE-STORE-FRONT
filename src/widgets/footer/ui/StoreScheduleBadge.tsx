"use client";

import { useState } from "react";
import { Clock, X, CheckCircle2, AlertCircle, MapPin, Phone } from "lucide-react";
import { useStoreBranch } from "@/entities/delivery";
import { formatPhoneMask } from "@/shared/lib/format/phone";
import { useDynamicStoreInfo } from "@/entities/settings";

export const StoreScheduleBadge = () => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const storeInfo = useDynamicStoreInfo();
  const selectedStore = useStoreBranch((state) => state.selectedStore);
  const workingHours = selectedStore
    ? selectedStore.working_hours?.trim() || "График работы не указан"
    : storeInfo.workingHours;
  const address = selectedStore
    ? [selectedStore.city, selectedStore.address].filter(Boolean).join(", ")
    : storeInfo.address;
  const rawPhone = selectedStore?.phone;
  const phone = selectedStore ? (rawPhone ? formatPhoneMask(rawPhone) : null) : storeInfo.phone;
  const phoneHref = rawPhone ? `tel:${rawPhone.replace(/[^\d+]/g, "")}` : storeInfo.phoneHref;
  const isRoundTheClock = /круглосуточно|24\s*\/\s*7|^24\s*часа$/i.test(workingHours);
  const isOpenNow = selectedStore ? isRoundTheClock : storeInfo.isOpenNow;

  // Current day of week (1: Monday .. 7: Sunday)
  const todayWeekday = (() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  })();

  const schedule = selectedStore ? [] : storeInfo.schedule || [];
  const todayItem = schedule.find((d) => d.day === todayWeekday);
  const statusText = selectedStore
    ? workingHours
    : storeInfo.statusText || (isOpenNow ? "Открыто сегодня" : "Сейчас закрыто");

  return (
    <>
      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {isOpenNow ? (
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <span className={`inline-block size-2.5 rounded-full ${selectedStore ? "bg-slate-400" : "bg-amber-500"}`} />
          )}

          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                isOpenNow ? "text-emerald-700" : selectedStore ? "text-slate-700" : "text-amber-800"
              }`}
            >
              {selectedStore
                ? workingHours
                : isOpenNow && todayItem?.close_time && !todayItem.is_day_off
                  ? `Открыто · до ${todayItem.close_time}`
                  : statusText}
            </span>

            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="cursor-pointer text-[11px] font-medium text-emerald-600 underline hover:text-emerald-800 transition"
            >
              График работы
            </button>
          </div>
        </div>

      </div>

      {/* Модальное окно с подробным графиком по дням недели */}
      {isOpenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpenModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all scale-100 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Clock size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Режим работы магазина</h3>
                  <p className="text-xs text-slate-400">{selectedStore?.name || workingHours}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current status banner */}
            <div
              className={`mt-4 flex items-center gap-3 rounded-xl p-3.5 border ${
                isOpenNow
                  ? "border-emerald-200/80 bg-emerald-50/60 text-emerald-900"
                  : selectedStore ? "border-slate-200 bg-slate-50 text-slate-900" : "border-amber-200/80 bg-amber-50/60 text-amber-900"
              }`}
            >
              {isOpenNow ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-amber-600 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold block">
                  {selectedStore ? workingHours : isOpenNow ? "Магазин сейчас открыт" : "Магазин сейчас закрыт"}
                </span>
                <span className="text-slate-600 text-[11px]">
                  {selectedStore ? selectedStore.name : statusText}
                  {!selectedStore && todayItem && ` · Сегодня: ${todayItem.is_day_off ? "Выходной" : `${todayItem.open_time} – ${todayItem.close_time}`}`}
                </span>
              </div>
            </div>

            {/* Weekly list */}
            {schedule.length > 0 && <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/40 overflow-hidden">
              {schedule.map((dayItem) => {
                const isToday = dayItem.day === todayWeekday;
                return (
                  <div
                    key={dayItem.day}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
                      isToday ? "bg-emerald-50/90 font-bold text-slate-900" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{dayItem.day_name}</span>
                      {isToday && (
                        <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                          Сегодня
                        </span>
                      )}
                    </div>

                    <div>
                      {dayItem.is_day_off ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-200/60">
                          Выходной
                        </span>
                      ) : (
                        <span className="font-semibold tabular-nums text-slate-800">
                          {dayItem.open_time} – {dayItem.close_time}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>}

            {/* Contacts & note */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-emerald-600 shrink-0" />
                <span>{address}</span>
              </div>
              {phone && <div className="flex items-center gap-2">
                <Phone size={13} className="text-emerald-600 shrink-0" />
                <a href={phoneHref} className="font-medium text-slate-700 hover:text-emerald-700">
                  {phone}
                </a>
              </div>}
            </div>

            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="mt-5 w-full cursor-pointer rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
