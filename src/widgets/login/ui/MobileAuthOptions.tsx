"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useDynamicStoreInfo } from "@/entities/settings/model/StoreSettingsProvider";
import { ROUTES } from "@/shared/config";

export const MobileAuthOptions = () => {
  const searchParams = useSearchParams();
  const { name } = useDynamicStoreInfo();
  const nextPath = searchParams.get("next");
  const nextQuery = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";

  return (
    <main
      data-no-mobile-nav
      className="auth-viewport flex items-center justify-center bg-white px-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-slate-900/10">
            <Image src="/brand-emblem.png" alt="" width={56} height={56} className="size-full object-contain" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">{name}</span>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link
            className="flex min-h-14 items-center justify-center rounded-2xl bg-emerald-600 px-6 text-base font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            href={`${ROUTES.LOGIN}?mode=form${nextQuery}`}
          >
            Войти
          </Link>
          <Link
            className="flex min-h-14 items-center justify-center rounded-2xl border border-emerald-700 px-6 text-base font-bold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98]"
            href={`${ROUTES.REGISTER}${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
          >
            Регистрация
          </Link>
        </div>
      </div>
    </main>
  );
};
