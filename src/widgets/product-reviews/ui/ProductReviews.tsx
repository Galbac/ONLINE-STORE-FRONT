"use client";

import Link from "next/link";

import { useEffect, useState, useTransition } from "react";
import { MessageSquare, Plus, Star, ThumbsDown, ThumbsUp } from "lucide-react";
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
  created_date: string;
}

interface ReviewListResponse {
  items: ReviewItem[];
  total: number;
  average_rating: number;
}

interface ProductReviewsProps {
  productId: number;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(5.0);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadReviews = async () => {
    try {
      const data = await apiClient.get<ReviewListResponse>(
        API_ENDPOINTS.REVIEW.BY_PRODUCT(productId),
      );
      setReviews(data.items);
      setTotal(data.total);
      setAverage(data.average_rating);
    } catch {
      // Fallback
    }
  };

  // Restore draft review if saved within 10 minutes (600,000 ms)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`pending_review_${productId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const TEN_MINUTES_MS = 10 * 60 * 1000;
        if (Date.now() - parsed.savedAt < TEN_MINUTES_MS) {
          if (parsed.rating) setRating(parsed.rating);
          if (parsed.text) setText(parsed.text);
          if (parsed.pros) setPros(parsed.pros);
          if (parsed.cons) setCons(parsed.cons);
          setShowForm(true);
          const token = getStoredAccessToken();
          if (token) {
            setSuccessMsg("Ваш черновик отзыва восстановлен. Вы можете отправить его прямо сейчас.");
          }
        } else {
          localStorage.removeItem(`pending_review_${productId}`);
        }
      }
    } catch (_) {}
  }, [productId]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await apiClient.get<ReviewListResponse>(
          API_ENDPOINTS.REVIEW.BY_PRODUCT(productId),
        );
        setReviews(data.items);
        setTotal(data.total);
        setAverage(data.average_rating);
      } catch {
        // Fallback
      }
    };
    void fetchReviews();
  }, [productId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredAccessToken();
    if (!token) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `pending_review_${productId}`,
          JSON.stringify({ rating, text, pros, cons, savedAt: Date.now() })
        );
      }
      setErrorMsg(
        "Для отправки отзыва необходимо войти в аккаунт. Мы сохранили ваш черновик на 10 минут!"
      );
      return;
    }
    if (text.trim().length < 3) {
      setErrorMsg("Текст отзыва должен быть не менее 3 символов.");
      return;
    }

    startTransition(async () => {
      try {
        setErrorMsg("");
        await apiClient.post(
          API_ENDPOINTS.REVIEW.BY_PRODUCT(productId),
          { rating, text, pros: pros.trim() || null, cons: cons.trim() || null },
          { Authorization: `Bearer ${token}` },
        );
        if (typeof window !== "undefined") {
          localStorage.removeItem(`pending_review_${productId}`);
        }
        setSuccessMsg("Спасибо! Ваш отзыв опубликован.");
        setText("");
        setPros("");
        setCons("");
        setShowForm(false);
        await loadReviews();
      } catch {
        setErrorMsg("Не удалось отправить отзыв. Попробуйте позже.");
      }
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Отзывы покупателей</h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={star <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                />
              ))}
            </div>
            <span className="text-lg font-black text-slate-900">{average.toFixed(1)}</span>
            <span className="text-xs text-slate-400">• {total} отзывов</span>
          </div>
        </div>

        <Button
          className="gap-2"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "primary"}
        >
          {showForm ? "Скрыть форму" : (
            <>
              <Plus size={16} />
              Оставить отзыв
            </>
          )}
        </Button>
      </div>

      {successMsg ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          {successMsg}
        </div>
      ) : null}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-slate-50 p-6 border border-slate-200/70 space-y-4 animate-in fade-in-0 duration-200">
          <h3 className="text-sm font-bold text-slate-900">Ваша оценка товару</h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 text-amber-400 hover:scale-110 transition-transform"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={26}
                  className={star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Комментарий <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              rows={3}
              placeholder="Расскажите о вкусе, качестве и свежести..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ThumbsUp size={13} className="text-emerald-600" /> Достоинства
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="Что понравилось?"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ThumbsDown size={13} className="text-rose-500" /> Недостатки
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="Что можно улучшить?"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
              />
            </div>
          </div>

          {errorMsg ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-semibold text-rose-700 animate-in fade-in-0 duration-150">
              <span>{errorMsg}</span>
              {!getStoredAccessToken() ? (
                <Link
                  href="/login"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Войти в аккаунт →
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Отправка..." : "Опубликовать отзыв"}
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="mt-8 space-y-4">
        {reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {r.user_name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">{r.user_name}</span>
                    <span className="block text-[10px] text-slate-400">
                      {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.created_date))}
                    </span>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                  ))}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-700">{r.text}</p>

              {r.pros ? (
                <p className="text-xs text-slate-600">
                  <strong className="text-emerald-700">Плюсы:</strong> {r.pros}
                </p>
              ) : null}
              {r.cons ? (
                <p className="text-xs text-slate-600">
                  <strong className="text-rose-600">Минусы:</strong> {r.cons}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageSquare size={22} />
            </span>
            <h4 className="text-sm font-bold text-slate-800">Пока нет отзывов</h4>
            <p className="mt-1 text-xs text-slate-400">Будьте первым, кто поделится своим мнением о товаре</p>
          </div>
        )}
      </div>
    </section>
  );
};
