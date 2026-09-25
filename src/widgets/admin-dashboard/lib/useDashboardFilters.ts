import { useCallback, useMemo, useState } from "react";

export type DashboardPeriodPreset = "today" | "yesterday" | "week" | "month" | "all" | "custom";

export interface DashboardFilterState {
  preset: DashboardPeriodPreset;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  label: string;
}

export interface UseDashboardFiltersReturn {
  preset: DashboardPeriodPreset;
  dateFrom: string;
  dateTo: string;
  label: string;
  isCustom: boolean;
  filterParams: {
    period: string;
    date_from?: string;
    date_to?: string;
  };
  setPreset: (preset: DashboardPeriodPreset) => void;
  setCustomRange: (dateFrom: string, dateTo: string) => void;
}

export const PRESET_OPTIONS: { value: DashboardPeriodPreset; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "yesterday", label: "Вчера" },
  { value: "week", label: "7 дней" },
  { value: "month", label: "30 дней" },
  { value: "all", label: "Всё время" },
];

const toIsoDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatReadableDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

export const calculateDatesForPreset = (
  preset: DashboardPeriodPreset,
): { dateFrom: string; dateTo: string; label: string } => {
  const now = new Date();
  const today = toIsoDateString(now);

  if (preset === "today") {
    return { dateFrom: today, dateTo: today, label: "Сегодня" };
  }

  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yesterday = toIsoDateString(y);
    return { dateFrom: yesterday, dateTo: yesterday, label: "Вчера" };
  }

  if (preset === "week") {
    const f = new Date(now);
    f.setDate(f.getDate() - 6);
    return {
      dateFrom: toIsoDateString(f),
      dateTo: today,
      label: "Последние 7 дней",
    };
  }

  if (preset === "month") {
    const f = new Date(now);
    f.setDate(f.getDate() - 29);
    return {
      dateFrom: toIsoDateString(f),
      dateTo: today,
      label: "Последние 30 дней",
    };
  }

  if (preset === "all") {
    return {
      dateFrom: "2020-01-01",
      dateTo: today,
      label: "За всё время",
    };
  }

  return {
    dateFrom: today,
    dateTo: today,
    label: "Выбранный период",
  };
};

export function useDashboardFilters(
  initialPreset: DashboardPeriodPreset = "week",
): UseDashboardFiltersReturn {
  const initial = useMemo(() => calculateDatesForPreset(initialPreset), [initialPreset]);

  const [preset, setPresetState] = useState<DashboardPeriodPreset>(initialPreset);
  const [dateFrom, setDateFrom] = useState<string>(initial.dateFrom);
  const [dateTo, setDateTo] = useState<string>(initial.dateTo);
  const [customLabel, setCustomLabel] = useState<string>("");

  const setPreset = useCallback((newPreset: DashboardPeriodPreset) => {
    setPresetState(newPreset);
    if (newPreset !== "custom") {
      const dates = calculateDatesForPreset(newPreset);
      setDateFrom(dates.dateFrom);
      setDateTo(dates.dateTo);
      setCustomLabel("");
    }
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setPresetState("custom");
    setCustomLabel(`${formatReadableDate(from)} — ${formatReadableDate(to)}`);
  }, []);

  const label = useMemo(() => {
    if (preset === "custom" && customLabel) {
      return customLabel;
    }
    return calculateDatesForPreset(preset).label;
  }, [preset, customLabel]);

  const filterParams = useMemo(() => {
    if (preset === "custom") {
      return {
        period: "custom",
        date_from: dateFrom,
        date_to: dateTo,
      };
    }
    return {
      period: preset,
      date_from: dateFrom,
      date_to: dateTo,
    };
  }, [preset, dateFrom, dateTo]);

  return {
    preset,
    dateFrom,
    dateTo,
    label,
    isCustom: preset === "custom",
    filterParams,
    setPreset,
    setCustomRange,
  };
}
