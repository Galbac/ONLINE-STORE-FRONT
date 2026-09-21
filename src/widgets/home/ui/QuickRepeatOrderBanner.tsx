"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { orderApi, type OrderShortResponse } from "@/entities/order";
import { getStoredAccessToken } from "@/shared/ui";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";
import { toast } from "sonner";
import { openCartDrawer } from "@/widgets/cart-drawer";

export const QuickRepeatOrderBanner = () => {
  const [lastOrder, setLastOrder] = useState<OrderShortResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    orderApi
      .getMyOrders({ page: 1, limit: 1 }, token)
      .then((res) => {
        if (res.items && res.items.length > 0 && res.items[0]) {
          setLastOrder(res.items[0]);
        }
      })
      .catch(() => {});
  }, []);

  if (!lastOrder) return null;

  const handleRepeat = () => {
    const token = getStoredAccessToken();
    if (!token) return;

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }

    startTransition(async () => {
      try {
        const response = await orderApi.repeatProfile(lastOrder.id, { replace_cart: false }, token);
        notifyCartChanged({ itemsCount: response.cart.items.length });
        toast.success("Товары из прошлого заказа добавлены в корзину!", {
          action: {
            label: "В корзину",
            onClick: () => openCartDrawer(),
          },
        });
      } catch {
        toast.error("Не удалось повторить заказ. Возможно, некоторые товары недоступны.");
      }
    });
  };

  let formattedDate = "";
  try {
    formattedDate = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    }).format(new Date(lastOrder.created_at));
  } catch {
    formattedDate = "";
  }

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
            <RotateCcw size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                Повторить прошлый заказ
              </h3>
              {formattedDate ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  от {formattedDate}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">
              Заказ {lastOrder.order_number} • Итого:{" "}
              <span className="font-bold text-slate-800">{toPriceFormat(lastOrder.final_price)}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleRepeat}
          className="inline-flex h-9 sm:h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <span>{isPending ? "Добавляем..." : "Повторить в 1 клик"}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
};
