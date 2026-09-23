"use client";

import { useState } from "react";
import { Clock, Copy } from "lucide-react";
import type { DayScheduleItem } from "@/entities/admin-settings";

interface WeeklyScheduleEditorProps {
  initialSchedule?: DayScheduleItem[] | null | undefined;
  workingHoursSummary?: string | null | undefined;
  onChange: (schedule: DayScheduleItem[], summaryText: string) => void;
}

const DEFAULT_DAYS: DayScheduleItem[] = [
  { day: 1, day_name: "Понедельник", is_day_off: false, open_time: "08:00", close_time: "22:00" },
  { day: 2, day_name: "Вторник", is_day_off: false, open_time: "08:00", close_time: "22:00" },
  { day: 3, day_name: "Среда", is_day_off: false, open_time: "08:00", close_time: "22:00" },
  { day: 4, day_name: "Четверг", is_day_off: false, open_time: "08:00", close_time: "22:00" },
  { day: 5, day_name: "Пятница", is_day_off: false, open_time: "08:00", close_time: "22:00" },
  { day: 6, day_name: "Суббота", is_day_off: false, open_time: "08:00", close_time: "22:00" },
  { day: 7, day_name: "Воскресенье", is_day_off: false, open_time: "08:00", close_time: "22:00" },
];

const SHORT_NAMES: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

export const formatScheduleSummaryClient = (days: DayScheduleItem[]): string => {
  const first = days[0];
  if (!first) return "График не задан";

  const allSame = days.every(
    (d) =>
      d.is_day_off === first.is_day_off &&
      d.open_time === first.open_time &&
      d.close_time === first.close_time
  );

  if (allSame) {
    if (first.is_day_off) return "Магазин закрыт";
    if (first.open_time === "00:00" && (first.close_time === "24:00" || first.close_time === "23:59")) {
      return "Круглосуточно (24/7)";
    }
    return `Ежедневно ${first.open_time ?? "08:00"}–${first.close_time ?? "22:00"}`;
  }

  const monFri = days.slice(0, 5);
  const satSun = days.slice(5, 7);
  const mfFirst = monFri[0];
  const ssFirst = satSun[0];

  if (mfFirst && ssFirst) {
    const mfSame = monFri.every(
      (d) =>
        d.is_day_off === mfFirst.is_day_off &&
        d.open_time === mfFirst.open_time &&
        d.close_time === mfFirst.close_time
    );
    const ssSame = satSun.every(
      (d) =>
        d.is_day_off === ssFirst.is_day_off &&
        d.open_time === ssFirst.open_time &&
        d.close_time === ssFirst.close_time
    );

    if (mfSame && ssSame) {
      const mfText = mfFirst.is_day_off ? "выходной" : `${mfFirst.open_time ?? "08:00"}–${mfFirst.close_time ?? "22:00"}`;
      const ssText = ssFirst.is_day_off ? "выходной" : `${ssFirst.open_time ?? "09:00"}–${ssFirst.close_time ?? "21:00"}`;
      return `Пн–Пт ${mfText}, Сб–Вс ${ssText}`;
    }
  }

  const parts: string[] = [];
  days.forEach((d) => {
    const label = SHORT_NAMES[d.day] ?? `День ${d.day}`;
    if (d.is_day_off) {
      parts.push(`${label} выходной`);
    } else {
      parts.push(`${label} ${d.open_time ?? "08:00"}–${d.close_time ?? "22:00"}`);
    }
  });

  return parts.join(", ");
};

export const WeeklyScheduleEditor = ({
  initialSchedule,
  workingHoursSummary,
  onChange,
}: WeeklyScheduleEditorProps) => {
  const [schedule, setSchedule] = useState<DayScheduleItem[]>(() => {
    if (initialSchedule && Array.isArray(initialSchedule) && initialSchedule.length === 7) {
      return initialSchedule;
    }
    return DEFAULT_DAYS;
  });

  const summary = formatScheduleSummaryClient(schedule);

  const updateDay = (dayNum: number, updates: Partial<DayScheduleItem>) => {
    setSchedule((prev) => {
      const next = prev.map((item) => (item.day === dayNum ? { ...item, ...updates } : item));
      const nextSummary = formatScheduleSummaryClient(next);
      onChange(next, nextSummary);
      return next;
    });
  };

  const applyPreset = (preset: "daily" | "weekdays_weekends" | "all_day" | "sunday_off") => {
    let next: DayScheduleItem[] = [];
    if (preset === "daily") {
      next = DEFAULT_DAYS.map((d) => ({
        ...d,
        is_day_off: false,
        open_time: "08:00",
        close_time: "22:00",
      }));
    } else if (preset === "weekdays_weekends") {
      next = DEFAULT_DAYS.map((d) => ({
        ...d,
        is_day_off: false,
        open_time: d.day <= 5 ? "08:00" : "09:00",
        close_time: d.day <= 5 ? "22:00" : "21:00",
      }));
    } else if (preset === "all_day") {
      next = DEFAULT_DAYS.map((d) => ({
        ...d,
        is_day_off: false,
        open_time: "00:00",
        close_time: "24:00",
      }));
    } else if (preset === "sunday_off") {
      next = DEFAULT_DAYS.map((d) => ({
        ...d,
        is_day_off: d.day === 7,
        open_time: d.day === 7 ? null : "08:00",
        close_time: d.day === 7 ? null : "22:00",
      }));
    }
    setSchedule(next);
    onChange(next, formatScheduleSummaryClient(next));
  };

  const copyMondayToWeekdays = () => {
    const monday = schedule.find((d) => d.day === 1) ?? schedule[0] ?? DEFAULT_DAYS[0]!;
    setSchedule((prev) => {
      const next = prev.map((d) => (d.day <= 5 ? { ...d, is_day_off: monday.is_day_off, open_time: monday.open_time, close_time: monday.close_time } : d));
      const nextSummary = formatScheduleSummaryClient(next);
      onChange(next, nextSummary);
      return next;
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock size={16} className="text-emerald-600" />
            График работы магазина по дням недели
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Настройте часы работы или укажите выходные дни для каждого дня недели
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
          <span>Сводка:</span>
          <span className="font-bold">{summary || workingHoursSummary || "Ежедневно"}</span>
        </div>
      </div>

      {/* Быстрые шаблоны */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-medium text-slate-400">Быстрые шаблоны:</span>
        <button
          type="button"
          onClick={() => applyPreset("daily")}
          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all"
        >
          🕒 Ежедневно 08:00–22:00
        </button>
        <button
          type="button"
          onClick={() => applyPreset("weekdays_weekends")}
          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all"
        >
          📅 Будни 08–22 / Сб-Вс 09–21
        </button>
        <button
          type="button"
          onClick={() => applyPreset("all_day")}
          className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
        >
          ⚡ Круглосуточно (24/7)
        </button>
        <button
          type="button"
          onClick={() => applyPreset("sunday_off")}
          className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-all"
        >
          🏖️ Вс выходной
        </button>
        <button
          type="button"
          onClick={copyMondayToWeekdays}
          className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-all inline-flex items-center gap-1"
        >
          <Copy size={12} />
          Скопировать Пн на все будни
        </button>
      </div>

      {/* Таблица / Сетка дней недели */}
      <div className="space-y-2 pt-2">
        {schedule.map((dayItem) => {
          const isWeekend = dayItem.day >= 6;
          return (
            <div
              key={dayItem.day}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${
                dayItem.is_day_off
                  ? "border-slate-200/80 bg-slate-50/80 opacity-75"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              {/* Название дня */}
              <div className="flex items-center gap-2.5 min-w-[150px]">
                <span
                  className={`flex size-7 items-center justify-center rounded-md text-xs font-bold ${
                    isWeekend
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {SHORT_NAMES[dayItem.day]}
                </span>
                <div>
                  <span className="text-sm font-bold text-slate-800">{dayItem.day_name}</span>
                  <span className="block text-[11px] text-slate-400">
                    {isWeekend ? "Выходной день недели" : "Будний день"}
                  </span>
                </div>
              </div>

              {/* Переключатель Выходной / Рабочий */}
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={dayItem.is_day_off}
                    onChange={(e) => {
                      const isOff = e.target.checked;
                      updateDay(dayItem.day, {
                        is_day_off: isOff,
                        open_time: isOff ? null : (dayItem.open_time || "08:00"),
                        close_time: isOff ? null : (dayItem.close_time || "22:00"),
                      });
                    }}
                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className={dayItem.is_day_off ? "text-rose-600 font-bold" : "text-slate-600"}>
                    {dayItem.is_day_off ? "Выходной (закрыто)" : "Рабочий день"}
                  </span>
                </label>
              </div>

              {/* Время открытия и закрытия */}
              <div className="flex items-center gap-2">
                {dayItem.is_day_off ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200/60">
                    Магазин в этот день не работает
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">с</span>
                    <input
                      type="time"
                      value={dayItem.open_time || "08:00"}
                      onChange={(e) => updateDay(dayItem.day, { open_time: e.target.value })}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="font-medium text-slate-500">до</span>
                    <input
                      type="time"
                      value={dayItem.close_time || "22:00"}
                      onChange={(e) => updateDay(dayItem.day, { close_time: e.target.value })}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
