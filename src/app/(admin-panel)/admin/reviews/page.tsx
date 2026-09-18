"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Star, X } from "lucide-react";
import { apiClient, API_ENDPOINTS } from "@/shared/api";
import { Button, getStoredAccessToken } from "@/shared/ui";

interface ReviewItem {
  id: number;
  product_id: number;
  user_name: string;
  rating: number;
  text: string;
  pros?: string | null;
  cons?: string | null;
  is_approved: boolean;
  created_date: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filterApproved, setFilterApproved] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadReviews = async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      let url = "/api/admin/reviews";
      if (filterApproved === "approved") url += "?is_approved=true";
      if (filterApproved === "pending") url += "?is_approved=false";

      const data = await apiClient.get<{ items: ReviewItem[] }>(url, undefined, {
        Authorization: `Bearer ${token}`,
      });
      setReviews(data.items);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const token = getStoredAccessToken();
      if (!token) return;
      try {
        let url = "/api/admin/reviews";
        if (filterApproved === "approved") url += "?is_approved=true";
        if (filterApproved === "pending") url += "?is_approved=false";

        const data = await apiClient.get<{ items: ReviewItem[] }>(url, undefined, {
          Authorization: `Bearer ${token}`,
        });
        setReviews(data.items);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    void fetchReviews();
  }, [filterApproved]);

  const handleModerate = (reviewId: number, isApproved: boolean) => {
    const token = getStoredAccessToken();
    if (!token) return;

    startTransition(async () => {
      try {
        await apiClient.patch(
          API_ENDPOINTS.REVIEW.MODERATE(reviewId),
          { is_approved: isApproved },
          { Authorization: `Bearer ${token}` },
        );
        await loadReviews();
      } catch {
        // Fallback
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Модерация отзывов</h1>
          <p className="text-xs text-slate-500">Проверка и управление отзывами покупателей на товары</p>
        </div>

        <div className="flex items-center gap-2">
          {["all", "approved", "pending"].map((f) => (
            <Button
              key={f}
              onClick={() => setFilterApproved(f)}
              variant={filterApproved === f ? "primary" : "secondary"}
              className="h-9 px-3.5 text-xs"
            >
              {f === "all" ? "Все" : f === "approved" ? "Одобренные" : "На модерации"}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {reviews.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700">
                      {r.user_name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{r.user_name}</span>
                      <span className="block text-[10px] text-slate-400">
                        Товар ID: {r.product_id} • {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.created_date))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                      ))}
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      r.is_approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {r.is_approved ? "Опубликован" : "Скрыт"}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-700">{r.text}</p>

                {r.pros ? <p className="text-xs text-slate-600"><strong className="text-emerald-700">Плюсы:</strong> {r.pros}</p> : null}
                {r.cons ? <p className="text-xs text-slate-600"><strong className="text-rose-600">Минусы:</strong> {r.cons}</p> : null}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  {!r.is_approved ? (
                    <Button
                      onClick={() => handleModerate(r.id, true)}
                      disabled={isPending}
                      className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check size={14} /> Одобрить
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleModerate(r.id, false)}
                      disabled={isPending}
                      variant="secondary"
                      className="h-8 px-3 text-xs gap-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <X size={14} /> Скрыть
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {isLoading ? "Загрузка отзывов..." : "Отзывы не найдены"}
          </div>
        )}
      </div>
    </div>
  );
}
