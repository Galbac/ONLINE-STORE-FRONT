"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { authApi } from "@/entities/auth";
import { ROUTES } from "@/shared/config";

interface ForgotPasswordFormValues {
  login: string;
}

const initialValues: ForgotPasswordFormValues = {
  login: "",
};

export const ForgotPasswordForm = () => {
  const [values, setValues] = useState<ForgotPasswordFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const cleanLogin = values.login.trim();
    if (cleanLogin.length < 3) {
      setErrorMessage("Введите корректный email или номер телефона.");
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        await authApi.forgotPassword({ login: cleanLogin });
        setIsSent(true);
      } catch {
        setErrorMessage("Не удалось отправить инструкцию. Проверьте введенные данные.");
      }
    });
  };

  if (isSent) {
    return (
      <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/70 p-8 text-center animate-in fade-in-0 duration-200">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
          <CheckCircle2 size={32} />
        </span>
        <h3 className="mt-4 text-xl font-bold text-slate-900">Инструкция отправлена</h3>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          Если аккаунт с указанным адресом или телефоном существует, мы выслали ссылку для сброса пароля.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            Вернуться ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">Восстановление доступа</h2>
        <p className="mt-1 text-xs text-slate-500">
          Мы пришлем вам ссылку или код для создания нового пароля
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Email или номер телефона <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
          <Mail size={18} className="text-slate-400 mr-2.5 shrink-0" />
          <input
            className="h-12 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            autoComplete="username"
            name="login"
            placeholder="user@example.com или +7 999 000-00-00"
            type="text"
            required
            value={values.login}
            onChange={(e) => setValues({ login: e.target.value })}
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 animate-in fade-in-0 duration-150">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30 active:scale-[0.99] transition-all disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Отправляем...</span>
          </>
        ) : (
          <>
            <span>Отправить инструкцию</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>

      <div className="border-t border-slate-100 pt-4 text-center">
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
          href={ROUTES.LOGIN}
        >
          <ArrowLeft size={14} />
          <span>Вернуться ко входу</span>
        </Link>
      </div>
    </form>
  );
};
