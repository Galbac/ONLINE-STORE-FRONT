"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { apiClient } from "@/shared/api";
import { Button, getStoredAccessToken } from "@/shared/ui";

interface FeedbackItem {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
  order_id?: number | null;
  status: "new" | "in_progress" | "resolved";
  created_date: string;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadFeedback = async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      const data = await apiClient.get<{ items: FeedbackItem[] }>("/api/admin/feedback", undefined, {
        Authorization: `Bearer ${token}`,
      });
      setFeedbacks(data.items);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    void loadFeedback();
  }, []);

  const handleReply = (feedbackId: number) => {
    const token = getStoredAccessToken();
    if (!token || !replyText.trim()) return;

    startTransition(async () => {
      try {
        await apiClient.post(
          `/api/admin/feedback/${feedbackId}/reply`,
          { message: replyText.trim() },
          { Authorization: `Bearer ${token}` },
        );
        setReplyText("");
        setSelectedId(null);
        await loadFeedback();
      } catch {
        // Fallback
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Обращения покупателей</h1>
        <p className="text-xs text-slate-500">Вопросы, отзывы и запросы в службу поддержки магазина</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
        {feedbacks.length > 0 ? (
          feedbacks.map((f) => (
            <div key={f.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-slate-900">{f.subject}</span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{f.name}</span>
                    {f.email ? <span className="flex items-center gap-1"><Mail size={12} /> {f.email}</span> : null}
                    {f.phone ? <span className="flex items-center gap-1"><Phone size={12} /> {f.phone}</span> : null}
                    {f.order_id ? <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold">Заказ #{f.order_id}</span> : null}
                  </div>
                </div>

                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    f.status === "new"
                      ? "bg-rose-50 text-rose-700"
                      : f.status === "in_progress"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {f.status === "new" ? "Новое" : f.status === "in_progress" ? "В работе" : "Решено"}
                </span>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl leading-relaxed">{f.message}</p>

              {selectedId === f.id ? (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <textarea
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-emerald-500"
                    rows={3}
                    placeholder="Напишите ответ клиенту (будет отправлен на указанный email)..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setSelectedId(null)} variant="secondary" className="h-8 px-3 text-xs">
                      Отмена
                    </Button>
                    <Button
                      onClick={() => handleReply(f.id)}
                      disabled={isPending}
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      <Send size={13} /> {isPending ? "Отправка..." : "Отправить ответ"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  {f.status !== "resolved" ? (
                    <Button
                      onClick={() => setSelectedId(f.id)}
                      variant="secondary"
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      <MessageSquare size={13} /> Ответить клиенту
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} /> Ответ отправлен
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">Обращений пока нет</div>
        )}
      </div>
    </div>
  );
}
