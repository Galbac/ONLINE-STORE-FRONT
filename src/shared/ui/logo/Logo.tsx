"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useDynamicStoreInfo } from "@/entities/settings";
import { ROUTES } from "@/shared/config";

export const Logo = () => {
  const { name } = useDynamicStoreInfo();

  return (
    <Link
      className="group flex items-center gap-3 transition-transform duration-200 active:scale-95"
      href={ROUTES.HOME}
      aria-label={name}
    >
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 shadow-md shadow-emerald-700/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-700/30">
        <Sparkles className="text-white" size={20} />
      </span>
      <span className="leading-tight">
        <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700">
          {name}
        </span>
        <span className="hidden lg:block text-xs font-medium text-slate-500">
          Свежесть каждый день!
        </span>
      </span>
    </Link>
  );
};
