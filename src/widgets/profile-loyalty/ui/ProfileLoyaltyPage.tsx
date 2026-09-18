"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send, Sparkles } from "lucide-react";
import { apiClient } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Button, Container, getStoredAccessToken } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

interface LoyaltyTransaction {
  id: number;
  amount: number;
  transaction_type: string;
  description: string;
  order_id?: number | null;
  created_date: string;
}

interface LoyaltyResponse {
  balance: number;
  level: string;
  cashback_percent: number;
  transactions: LoyaltyTransaction[];
}

interface TelegramConnectResponse {
  connect_url: string;
  is_connected: boolean;
}

export const ProfileLoyaltyPage = () => {
  const [loyalty, setLoyalty] = useState<LoyaltyResponse | null>(null);
  const [tgConnected, setTgConnected] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    const token = getStoredAccessToken();
    if (!token) return;

    try {
      const [loyaltyData, tgStatus] = await Promise.all([
        apiClient.get<LoyaltyResponse>("/api/profile/loyalty", undefined, {
          Authorization: `Bearer ${token}`,
        }),
        apiClient.get<{ is_connected: boolean }>("/api/profile/telegram/status", undefined, {
          Authorization: `Bearer ${token}`,
        }),
      ]);
      setLoyalty(loyaltyData);
      setTgConnected(tgStatus.is_connected);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleConnectTelegram = () => {
    const token = getStoredAccessToken();
    if (!token) return;

    startTransition(async () => {
      try {
        const res = await apiClient.post<unknown, TelegramConnectResponse>(
          "/api/profile/telegram/connect",
          {},
          { Authorization: `Bearer ${token}` },
        );
        if (res.connect_url) {
          window.open(res.connect_url, "_blank");
        }
      } catch {
        // Fallback
      }
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-[70vh] py-8 bg-slate-50/50">
        <Container className="max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.PROFILE}
              className="flex size-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-xs"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Программа лояльности</h1>
              <p className="text-xs text-slate-500">Копите бонусы за каждый заказ и оплачивайте ими покупки</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 p-8 text-white shadow-xl">
            <div className="pointer-events-none absolute -top-12 -right-12 size-64 rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800/60 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/20">
                  <Sparkles size={13} className="text-emerald-400" />
                  Уровень «{loyalty?.level ?? "Базовый"}»
                </span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {loyalty?.balance ?? 0}
                  </span>
                  <span className="text-xl font-bold text-emerald-300">бонусов</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">1 бонус = 1 рубль скидки. Списывайте в корзине до 50% чека.</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/10 text-center">
                <span className="block text-2xl font-black text-emerald-400">{loyalty?.cashback_percent ?? 5}%</span>
                <span className="mt-0.5 block text-xs font-medium text-slate-300">Кэшбэк на заказы</span>
              </div>
            </div>
          </div>

          {/* Telegram notifications widget */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Send size={22} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Уведомления о заказах в Telegram</h3>
                <p className="text-xs text-slate-500">
                  {tgConnected
                    ? "Ваш Telegram привязан. Мы отправляем статусы доставки прямо в мессенджер."
                    : "Подключите Telegram, чтобы получать пуши, когда курьер выехал."}
                </p>
              </div>
            </div>

            {tgConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={16} />
                Подключено
              </span>
            ) : (
              <Button onClick={handleConnectTelegram} disabled={isPending} className="gap-2">
                <Send size={15} />
                Подключить бота
              </Button>
            )}
          </div>

          {/* Transactions history */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">История операций</h3>
            {loyalty?.transactions && loyalty.transactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {loyalty.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl font-black text-sm ${
                          t.amount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {t.amount > 0 ? "+" : "-"}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{t.description}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(t.created_date))}
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${t.amount > 0 ? "text-emerald-700" : "text-slate-800"}`}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount} ₽
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Пока нет операций. Оформите первый заказ, чтобы получить кэшбэк!
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};
