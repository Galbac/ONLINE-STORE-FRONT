"use client";

import { useState } from "react";
import { Heart, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

interface OrderCourierTipsProps {
  orderId: number;
}

const TIP_AMOUNTS = [50, 100, 150, 200];

export const OrderCourierTips = ({ orderId: _orderId }: OrderCourierTipsProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRating = (score: number) => {
    setRating(score);
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(12); } catch (_) {}
    }
    toast.success(`Спасибо за оценку: ${score} из 5!`);
  };

  const handleSendTip = (amount: number) => {
    setSelectedTip(amount);
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(20); } catch (_) {}
    }
    setIsSubmitted(true);
    toast.success(`Спасибо! Чаевые ${amount} ₽ отправлены курьеру ❤️`);
  };

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-5 shadow-xs mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ThumbsUp size={18} className="text-emerald-600" />
            Как прошла доставка?
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Оцените скорость и качество работы курьера и сборщика
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRating(star)}
              className="p-1 text-slate-300 hover:text-amber-400 active:scale-90 transition"
              aria-label={`Оценить на ${star}`}
            >
              <Star
                size={22}
                className={rating && star <= rating ? "fill-amber-400 text-amber-400" : ""}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Courier Tips */}
      <div className="mt-4 pt-4 border-t border-emerald-100/70 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          Поблагодарить курьера чаевыми:
        </span>

        {isSubmitted ? (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-xl">
            Чаевые {selectedTip} ₽ отправлены!
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {TIP_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSendTip(amt)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 active:scale-95 transition shadow-2xs"
              >
                +{amt} ₽
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
