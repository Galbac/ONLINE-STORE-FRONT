"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Play, Printer } from "lucide-react";
import { apiClient } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Button, getStoredAccessToken } from "@/shared/ui";

interface AssemblyOrderItem {
  id: number;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  final_price: string | number;
  created_at: string;
}

export default function AdminAssemblyPage() {
  const [orders, setOrders] = useState<AssemblyOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadOrders = async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      const data = await apiClient.get<{ items: AssemblyOrderItem[] }>("/api/admin/orders/assembly", undefined, {
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
    void loadOrders();
  }, []);

  const handleStart = (orderId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    startTransition(async () => {
      try {
        await apiClient.post(`/api/admin/orders/${orderId}/start-assembly`, {}, {
          Authorization: `Bearer ${token}`,
        });
        await loadOrders();
      } catch {
        // Fallback
      }
    });
  };

  const handleComplete = (orderId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    startTransition(async () => {
      try {
        await apiClient.post(`/api/admin/orders/${orderId}/complete-assembly`, {}, {
          Authorization: `Bearer ${token}`,
        });
        await loadOrders();
      } catch {
        // Fallback
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Сборка заказов (Склад / Даркстор)</h1>
        <p className="text-xs text-slate-500">Очередь заказов, ожидающих комплектации товаров</p>
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
                      o.status === "assembling"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {o.status === "assembling" ? "В процессе сборки" : "Ожидает сборщика"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  <span>Клиент: {o.customer_name}</span>
                  <span>Сумма: {toPriceFormat(o.final_price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={ROUTES.ADMIN_ORDER_PRINT(o.id)}
                  target="_blank"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Printer size={14} /> Печать листа
                </Link>

                {o.status !== "assembling" ? (
                  <Button
                    onClick={() => handleStart(o.id)}
                    disabled={isPending}
                    className="h-9 px-4 text-xs gap-1.5"
                  >
                    <Play size={13} /> Начать сборку
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleComplete(o.id)}
                    disabled={isPending}
                    className="h-9 px-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={14} /> Собрано
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {isLoading ? "Загрузка очереди сборки..." : "Все заказы собраны!"}
          </div>
        )}
      </div>
    </div>
  );
}
