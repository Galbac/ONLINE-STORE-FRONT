"use client";

import Link from "next/link";
import { cn } from "@/shared/config";

export interface QuickFilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  href: string;
}

interface QuickFilterChipsProps {
  chips: QuickFilterOption[];
  className?: string;
}

export const QuickFilterChips = ({ chips, className }: QuickFilterChipsProps) => {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none", className)}>
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={chip.href}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-95 select-none",
            chip.active
              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700",
          )}
        >
          {chip.icon}
          {chip.label}
        </Link>
      ))}
    </div>
  );
};
