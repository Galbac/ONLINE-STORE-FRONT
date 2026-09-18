"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Phone, Truck } from "lucide-react";
import { apiClient } from "@/shared/api";
import { toPriceFormat } from "@/shared/lib/format";
import { Button, getStoredAccessToken } from "@/shared/ui";

interface CourierOrderItem {
  id: number;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  final_price: string | number;
  created_at: string;
}

export default function AdminCourierPage() {
  const [orders, setOrders] = useState<CourierOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadQueue = async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      const data = await apiClient.get<{ items: CourierOrderItem[] }>("/api/admin/orders/courier/queue", undefined, {
        Authorization: `Bearer ${token}`,
      });
      setOrders(data.items);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const handleTake = (orderId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    startTransition(async () => {
      try {
        await apiClient.post(`/api/admin/orders/${orderId}/take-delivery`, {}, {
          Authorization: `Bearer ${token}`,
        });
        await loadQueue();
      } catch {
        // Fallback
      }
    });
  };

  const handleDelivered = (orderId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    startTransition(async () => {
      try {
        await apiClient.post(`/api/admin/orders/${orderId}/mark-delivered`, {}, {
          Authorization: `Bearer ${token}`,
        });
        await loadQueue();
      } catch {
        // Fallback
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Доставка заказов (Маршрутный лист курьера)</h1>
        <p className="text-xs text-slate-500">Заказы, готовые к погрузке и доставке покупателям</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
        {orders.length > 0 ? (
          orders.map((o) => (
            <div key={o.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-slate-900">№{o.order_number}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      o.status === "in_delivery"
                        ? "bg-sky-50 text-sky-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {o.status === "in_delivery" ? "В пути к клиенту" : "Готов к доставке"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                  <span>{o.customer_name}</span>
                  <a href={`tel:${o.customer_phone}`} className="flex items-center gap-1 font-bold text-slate-700 hover:text-emerald-700">
                    <Phone size={12} /> {o.customer_phone}
                  </a>
                  <span>К оплате / сумма: {toPriceFormat(o.final_price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {o.status !== "in_delivery" ? (
                  <Button
                    onClick={() => handleTake(o.id)}
                    disabled={isPending}
                    className="h-9 px-4 text-xs gap-1.5"
                  >
                    <Truck size={14} /> Забрать заказ
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleDelivered(o.id)}
                    disabled={isPending}
                    className="h-9 px-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check size={14} /> Вручено покупателю
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {isLoading ? "Загрузка очереди доставки..." : "Все заказы доставлены!"}
          </div>
        )}
      </div>
    </div>
  );
}
