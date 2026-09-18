"use client";

import Link from "next/link";
import { cn } from "@/shared/config";

interface DietaryFilterProps {
  currentTag?: string | undefined;
  buildHref: (tag?: string) => string;
}

export const DietaryFilter = ({ currentTag, buildHref }: DietaryFilterProps) => {
  const options = [
    { value: undefined, label: "Все" },
    { value: "без сахара", label: "🍃 Без сахара" },
    { value: "без глютена", label: "🌾 Без глютена" },
    { value: "органик", label: "🌿 Органик / ЗоЖ" },
    { value: "фермерское", label: "🥛 Фермерское" },
    { value: "халяль", label: "🥩 Халяль" },
  ];

  return (
    <div className="space-y-1">
      {options.map((option) => {
        const isActive = currentTag?.toLowerCase() === option.value?.toLowerCase();
        return (
          <Link
            key={option.label}
            href={buildHref(option.value)}
            className={cn(
              "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "bg-emerald-50 text-emerald-800 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <span>{option.label}</span>
            {isActive && <span className="size-1.5 rounded-full bg-emerald-600" />}
          </Link>
        );
      })}
    </div>
  );
};
