"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

import { ROUTES } from "@/shared/config";

const COOKIE_CONSENT_STORAGE_KEY = "pobeda_cookie_consent";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) !== "accepted");
  }, []);

  const handleAccept = (): void => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "accepted");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-5xl rounded-lg border border-border bg-bg-primary p-4 shadow-[0_18px_60px_rgb(20_28_18/0.18)] md:right-6 md:bottom-6 md:left-auto md:w-[520px]">
      <div className="grid gap-4 md:grid-cols-[32px_1fr_auto] md:items-start">
        <span className="text-accent-primary hidden md:block">
          <Cookie size={28} />
        </span>
        <div>
          <h2 className="text-base font-bold">Cookies на сайте</h2>
          <p className="text-text-secondary mt-2 text-sm leading-6">
            Мы используем cookies для работы сайта, авторизации, корзины, оформления заказов и
            улучшения сервиса.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="text-accent-primary hover:text-accent-hover" href={ROUTES.COOKIE_POLICY}>
              Подробнее
            </Link>
            <Link className="text-accent-primary hover:text-accent-hover" href={ROUTES.PRIVACY}>
              Политика данных
            </Link>
          </div>
        </div>
        <button
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover h-11 rounded-lg px-5 text-sm font-bold transition"
          type="button"
          onClick={handleAccept}
        >
          Понятно
        </button>
      </div>
    </section>
  );
};
