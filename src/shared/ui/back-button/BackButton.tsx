"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn, ROUTES } from "@/shared/config";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
  label?: string;
}

export const BackButton = ({
  fallbackHref = ROUTES.CATALOG,
  className,
  label = "Назад",
}: BackButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs backdrop-blur-md transition-all hover:bg-slate-50 hover:text-emerald-700 active:scale-95",
        className,
      )}
      aria-label="Вернуться назад"
    >
      <ArrowLeft size={16} className="text-slate-600 group-hover:text-emerald-700" />
      <span>{label}</span>
    </button>
  );
};
