"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AlertCircle, Loader2, ShieldCheck, X } from "lucide-react";
import { userApi } from "@/entities/user";
import { toast } from "sonner";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  phone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PhoneVerificationModal = ({
  isOpen,
  phone,
  onClose,
  onSuccess,
}: PhoneVerificationModalProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [isVerifying, startVerifying] = useTransition();

  const handleSendOtp = useCallback(() => {
    setError(null);
    startSending(async () => {
      try {
        await userApi.sendPhoneOtp();
        setCountdown(60);
        toast.info(`Код подтверждения отправлен на ${phone}`);
      } catch {
        setError("Не удалось отправить SMS. Повторите попытку позже.");
      }
    });
  }, [phone]);

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setError(null);
      return;
    }
    handleSendOtp();
  }, [isOpen, handleSendOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Введите код подтверждения");
      return;
    }
    setError(null);
    startVerifying(async () => {
      try {
        await userApi.verifyPhoneOtp(code.trim());
        toast.success("Номер телефона успешно подтвержден!");
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err?.message || "Неверный или истекший код подтверждения");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck size={26} />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Подтверждение номера телефона</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Мы отправили 4-значный SMS-код на ваш номер <span className="font-bold text-slate-800">{phone}</span>.
        </p>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-semibold text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Код из SMS:
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              required
              placeholder="Например, 1234"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-12 w-full text-center text-xl font-black tracking-widest rounded-xl border border-slate-300 px-4 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            {countdown > 0 ? (
              <span className="text-slate-400">Отправить повторно через {countdown} сек.</span>
            ) : (
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendOtp}
                className="font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                {isSending ? "Отправка..." : "Отправить код повторно"}
              </button>
            )}
          </div>

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
              disabled={isVerifying || code.length < 4}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Проверка...</span>
                </>
              ) : (
                <span>Подтвердить</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
