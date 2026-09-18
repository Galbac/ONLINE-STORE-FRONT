"use client";

import { useEffect, useState } from "react";
import { Check, Clock, XCircle } from "lucide-react";
import { orderApi, type OrderTrackingResponse, type OrderTrackingStep } from "@/entities/order";
import { getStoredAccessToken } from "@/shared/ui";

interface OrderTrackingTimelineProps {
  orderId: number;
}

export const OrderTrackingTimeline = ({ orderId }: OrderTrackingTimelineProps) => {
  const [tracking, setTracking] = useState<OrderTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const token = getStoredAccessToken();
        const data = await orderApi.getTracking(orderId, token);
        if (isMounted) {
          setTracking(data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void load();
    // Live polling every 12 seconds
    const interval = setInterval(() => {
      if (tracking && (tracking.current_status === "delivered" || tracking.current_status === "cancelled")) {
        return;
      }
      void load();
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, tracking?.current_status]);

  if (isLoading || !tracking) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="mt-6 flex gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = tracking.current_status === "cancelled";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Трекинг заказа {tracking.order_number}
          </h3>
          <p className="text-xs text-slate-500">
            Способ получения: {tracking.delivery_type === "pickup" ? "Самовывоз" : "Курьерская доставка"}
          </p>
        </div>
        {tracking.estimated_delivery ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
            <Clock size={14} />
            {tracking.estimated_delivery}
          </span>
        ) : null}
      </div>

      <div className="mt-6 relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {tracking.steps.map((step: OrderTrackingStep) => {
          return (
            <div key={step.step_key} className="relative flex items-start gap-4">
              <span
                className={`absolute -left-6 flex size-6 items-center justify-center rounded-full text-white ring-4 ring-white transition-all ${
                  isCancelled && step.step_key === "cancelled"
                    ? "bg-rose-500"
                    : step.is_completed
                    ? "bg-emerald-600 shadow-sm"
                    : "bg-slate-300"
                }`}
              >
                {isCancelled && step.step_key === "cancelled" ? (
                  <XCircle size={14} />
                ) : step.is_completed ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <span className="size-2 rounded-full bg-white" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4
                    className={`text-sm font-bold ${
                      step.is_current
                        ? "text-emerald-700 font-extrabold"
                        : step.is_completed
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.timestamp ? (
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Intl.DateTimeFormat("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(step.timestamp))}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
