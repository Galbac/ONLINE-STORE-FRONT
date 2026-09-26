import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MapPin, Store, Truck } from "lucide-react";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

export interface DeliveryWidgetsProps {
  deliveryTitle?: string | undefined;
  deliveryDescription?: string | null | undefined;
  deliveryPrice?: string | null | undefined;
  freeFromAmount?: string | null | undefined;
  pickupTitle?: string | undefined;
  pickupDescription?: string | null | undefined;
  currentCartAmount?: number | undefined;
}

export const DeliveryWidgets = ({
  deliveryTitle = "Курьерская доставка",
  deliveryDescription = "Привезем свежие продукты прямо к вашей двери с соблюдением температурного режима.",
  deliveryPrice = "150",
  freeFromAmount = "1500",
  pickupTitle = "Быстрый самовывоз",
  pickupDescription = "Соберем ваш заказ заранее. Забирайте без очередей в удобное время.",
  currentCartAmount = 300,
}: DeliveryWidgetsProps) => {
  const targetFreeAmount = freeFromAmount ? parseFloat(freeFromAmount) || 1500 : 1500;
  const currentTotal = currentCartAmount || 0;
  const amountToFree = Math.max(0, targetFreeAmount - currentTotal);
  const progressPercent = Math.min(100, Math.round((currentTotal / targetFreeAmount) * 100));

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* 1. Карточка курьерской доставки */}
      <div className="flex flex-col justify-between rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
              <Truck size={24} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-white/80 px-3 py-1 text-xs font-bold text-emerald-800 backdrop-blur-xs shadow-2xs">
              <Clock size={13} className="text-emerald-600" />
              45–60 мин
            </span>
          </div>

          <h3 className="mt-5 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {deliveryTitle}
          </h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
            {deliveryDescription}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-semibold">
            <div className="flex items-center gap-2 rounded-xl bg-white/90 p-3 text-slate-800 shadow-2xs">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>От {toPriceFormat(deliveryPrice)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/90 p-3 text-slate-800 shadow-2xs">
              <Clock size={16} className="text-emerald-600 shrink-0" />
              <span>08:00 – 22:00</span>
            </div>
          </div>
        </div>

        {/* Прогресс-бар бесплатной доставки */}
        <div className="mt-6 rounded-2xl border border-emerald-200/60 bg-white/90 p-4 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-800">
              {amountToFree > 0
                ? `Добавьте товаров на ${toPriceFormat(amountToFree)} для бесплатной доставки`
                : "🎉 У вас бесплатная доставка!"}
            </span>
            <span className="text-emerald-700">{progressPercent}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Бесплатно при сумме заказа от {toPriceFormat(targetFreeAmount)}
          </p>
        </div>
      </div>

      {/* 2. Карточка самовывоза */}
      <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-slate-50/50 to-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <Store size={24} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-800">
              ⚡ Готов через 15 минут
            </span>
          </div>

          <h3 className="mt-5 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {pickupTitle}
          </h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
            {pickupDescription}
          </p>

          <div className="mt-5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 font-semibold text-slate-800 shadow-2xs border border-slate-100">
              <MapPin size={16} className="text-emerald-600 shrink-0" />
              <span>{STORE_INFO.address}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 font-semibold text-slate-800 shadow-2xs border border-slate-100">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Бесплатно при любой сумме заказа</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-2">
          <Link
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
            href={ROUTES.CHECKOUT}
          >
            Выбрать пункт самовывоза
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
