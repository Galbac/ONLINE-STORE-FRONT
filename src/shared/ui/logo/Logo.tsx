"use client";

import Link from "next/link";
import Image from "next/image";

import { useDynamicStoreInfo } from "@/entities/settings";
import { ROUTES } from "@/shared/config";

export const Logo = () => {
  const { name } = useDynamicStoreInfo();

  return (
    <Link
      className="group flex min-w-0 items-center gap-2 sm:gap-3 transition-transform duration-200 active:scale-95"
      href={ROUTES.HOME}
      aria-label={name}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-md shadow-slate-900/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-slate-900/15 sm:size-10">
        <Image
          src="/brand-emblem.png"
          alt=""
          width={40}
          height={40}
          priority
          className="size-full object-contain"
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-base font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-xl">
          {name}
        </span>
        <span className="hidden lg:block text-xs font-medium text-slate-500">
          Свежесть каждый день!
        </span>
      </span>
    </Link>
  );
};
