"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, KeyRound, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { authApi } from "@/entities/auth";
import { extractErrorMessage } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { storeAuthTokens } from "@/shared/ui";
import type { RegisterDraftData } from "@/features/register-user";

export const VerifyOtpForm = () => {
  const router = useRouter();
  const [draft, setDraft] = useState<RegisterDraftData | null>(null);
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [otpCooldown, setOtpCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("grocery_reg_draft");
      if (!saved) {
        router.replace(ROUTES.REGISTER);
        return;
      }
      const parsed: RegisterDraftData = JSON.parse(saved);
      if (!parsed.email || !parsed.name || !parsed.password) {
        router.replace(ROUTES.REGISTER);
        return;
      }
      setDraft(parsed);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch {
      router.replace(ROUTES.REGISTER);
    }
  }, [router]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleOtpChange = (index: number, val: string): void => {
    const cleanDigit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = cleanDigit;
    setOtpCode(newOtp);
    setErrorMessage(null);
    if (cleanDigit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!/^[0-9]$/.test(e.key) && !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pastedData) return;
    const newOtp = ["", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtpCode(newOtp);
    setErrorMessage(null);
    const nextIndex = Math.min(pastedData.length, 3);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async (): Promise<void> => {
    if (!draft || otpCooldown > 0 || isResending) return;
    try {
      setErrorMessage(null);
      setIsResending(true);
      const res = await authApi.sendRegisterOtp({
        email: draft.email,
        phone: draft.phone || null,
      });
      setOtpCooldown(res.cooldown_seconds || 60);
      setSuccessMessage("Новый код отправлен на ваш email");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMessage(detail || "Не удалось отправить повторный код. Попробуйте позже.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const domDigits = Array.from(event.currentTarget.querySelectorAll("input[inputmode=\"numeric\"]")).map((el) => (el as HTMLInputElement).value).join("");
    const fullCode = domDigits.length === 4 ? domDigits : (otpCode.join("").length === 4 ? otpCode.join("") : domDigits);
    if (fullCode.length !== 4) {
      setErrorMessage("Введите 4 цифры проверочного кода из полученного письма.");
      return;
    }
    if (!draft) {
      router.replace(ROUTES.REGISTER);
      return;
    }
    try {
      setIsPending(true);
      setErrorMessage(null);
      const response = await authApi.register({
        email: draft.email,
        name: draft.name,
        phone: draft.phone,
        password: draft.password,
        otp_code: fullCode,
        agreed_to_privacy: draft.agreement,
        marketing_consent: draft.marketingConsent,
      });
      storeAuthTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        remember: true,
      });
      await authApi.getMe(response.access_token);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("grocery_reg_draft");
      }
      router.push(ROUTES.PROFILE);
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, "Неверный проверочный код. Проверьте почту и повторите ввод."));
    } finally {
      setIsPending(false);
    }
  };

  if (!draft) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <form
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10"
      onSubmit={handleSubmit}
    >
      <div className="text-center sm:text-left">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 mb-3 shadow-2xs">
          <KeyRound size={22} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Подтверждение почты</h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Мы отправили 4-значный проверочный код на{" "}
          <strong className="text-slate-800 font-semibold">{draft.email}</strong>.
          <br className="hidden sm:inline" /> Введите его ниже для завершения регистрации.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
        <label className="block text-center text-xs font-bold text-slate-700 mb-3">
          Код подтверждения
        </label>

        <div className="flex items-center gap-3 sm:gap-4 justify-center py-2">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              ref={(el) => {
                otpInputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={otpCode[index] || ""}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handleOtpPaste}
              className="size-14 rounded-2xl border-2 border-slate-300 bg-white text-center font-mono text-2xl font-black text-slate-900 shadow-sm transition-all focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            />
          ))}
        </div>

        <div className="mt-4 text-center">
          {otpCooldown > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <RefreshCw size={13} />
              <span>Повторный код через {otpCooldown} сек</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all disabled:opacity-60 cursor-pointer"
            >
              {isResending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Отправить код ещё раз</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 animate-in fade-in-0 duration-150">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 flex items-center gap-2 animate-in fade-in-0 duration-150">
          <CheckCircle size={15} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className="space-y-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer",
            isPending && "cursor-wait opacity-75",
          )}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Проверка кода...</span>
            </>
          ) : (
            <>
              <span>Подтвердить и завершить</span>
              <ShieldCheck size={16} />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
          >
            <ArrowLeft size={14} />
            <span>Вернуться назад</span>
          </Link>
        </div>
      </div>
    </form>
  );
};
