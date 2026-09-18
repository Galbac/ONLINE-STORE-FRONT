"use client";

import { useState, useTransition } from "react";
import { Bell, Check, Loader2, X } from "lucide-react";
import { apiClient } from "@/shared/api";
import { Button } from "@/shared/ui";

interface StockAlertButtonProps {
  productId: number;
  productName: string;
  className?: string;
}

export const StockAlertButton = ({
  productId,
  productName,
  className,
}: StockAlertButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = contact.trim();
    if (!trimmed) {
      setErrorMessage("Введите email или телефон");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const isEmail = trimmed.includes("@");
        await apiClient.post(`/api/products/${productId}/subscribe-stock`, {
          email: isEmail ? trimmed : null,
          phone: isEmail ? null : trimmed,
        });
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setContact("");
        }, 2200);
      } catch {
        setErrorMessage("Не удалось оформить подписку. Попробуйте позже.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className || "inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"}
        title="Уведомить о поступлении"
      >
        <Bell size={14} className="text-amber-600" />
        <span>Уведомить</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Bell size={22} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Уведомить о поступлении
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Мы пришлем сообщение, как только «<span className="font-semibold text-slate-700">{productName}</span>» снова появится на складе.
            </p>

            {isSuccess ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800">
                <Check size={16} className="text-emerald-600 shrink-0" />
                Готово! Мы уведомим вас о появлении товара.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Email или телефон:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ivan@mail.ru или +7 (999) 000-00-00"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {errorMessage && (
                    <p className="mt-1 text-xs text-rose-600">{errorMessage}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsOpen(false)}
                    className="h-10 text-xs"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-10 text-xs font-bold"
                  >
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Подписаться"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
