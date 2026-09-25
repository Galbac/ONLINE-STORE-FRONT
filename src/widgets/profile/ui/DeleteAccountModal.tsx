"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { userApi } from "@/entities/user";
import { clearStoredAuth } from "@/shared/ui";
import { ROUTES } from "@/shared/config";
import { toast } from "sonner";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal = ({ isOpen, onClose }: DeleteAccountModalProps) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();
  const router = useRouter();

  if (!isOpen) return null;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Введите пароль для подтверждения удаления");
      return;
    }
    if (!confirm) {
      setError("Подтвердите согласие на отзыв персональных данных");
      return;
    }

    setError(null);
    startDeleting(async () => {
      try {
        await userApi.deleteMe({ password: password.trim(), confirm: true });
        clearStoredAuth();
        toast.success("Ваш аккаунт и персональные данные успешно удалены");
        onClose();
        router.push(ROUTES.HOME);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || "Не удалось удалить аккаунт. Проверьте пароль или завершите активные заказы.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <AlertTriangle size={26} />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Удаление аккаунта и данных</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          В соответствии со ст. 9 и 14 Федерального закона № 152-ФЗ «О персональных данных», ваши личные данные будут безвозвратно обезличены. Вы не сможете войти в данный аккаунт.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Пароль от аккаунта для подтверждения:
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Введите ваш текущий пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-0.5 size-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
            />
            <span className="text-xs text-slate-600 leading-normal font-medium">
              Я подтверждаю отзыв согласия на обработку персональных данных и удаление профиля
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isDeleting || !password || !confirm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm shadow-rose-700/20 hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Удаление...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Удалить аккаунт</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
