"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { authApi } from "@/entities/auth";
import { ROUTES } from "@/shared/config";

interface ResetPasswordFormProps {
  token: string;
}

interface ResetPasswordFormValues {
  password: string;
  passwordConfirm: string;
}

const initialValues: ResetPasswordFormValues = {
  password: "",
  passwordConfirm: "",
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [values, setValues] = useState<ResetPasswordFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const rules = useMemo(
    () => [
      { title: "Не менее 8 символов", isValid: values.password.length >= 8 },
      { title: "Минимум одна цифра", isValid: /\d/.test(values.password) },
      { title: "Минимум одна заглавная буква", isValid: /[A-ZА-ЯЁ]/.test(values.password) },
    ],
    [values.password],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!token) {
      setErrorMessage("Ссылка недействительна: отсутствует токен восстановления.");
      return;
    }
    if (!rules.every((r) => r.isValid)) {
      setErrorMessage("Пароль не соответствует требованиям безопасности.");
      return;
    }
    if (values.password !== values.passwordConfirm) {
      setErrorMessage("Пароли не совпадают.");
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        await authApi.resetPassword({
          token,
          new_password: values.password,
          new_password_confirm: values.passwordConfirm,
        });
        setIsSuccess(true);
        setValues(initialValues);
      } catch {
        setErrorMessage("Не удалось сбросить пароль. Ссылка могла устареть.");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-8 text-center animate-in fade-in-0 duration-200 max-w-md mx-auto">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
          <Check size={32} />
        </span>
        <h3 className="mt-4 text-xl font-bold text-slate-900">Пароль успешно обновлен!</h3>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Теперь вы можете войти в аккаунт с новым паролем.
        </p>
        <div className="mt-6">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10 max-w-lg mx-auto"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">Придумайте новый пароль</h2>
        <p className="mt-1 text-xs text-slate-500">Задайте надежный пароль для защиты вашего аккаунта</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Новый пароль <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <LockKeyhole size={17} className="text-slate-400 mr-2.5" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Минимум 8 знаков"
              value={values.password}
              onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
              className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="text-slate-400 hover:text-slate-600 p-1">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Повторите пароль <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <LockKeyhole size={17} className="text-slate-400 mr-2.5" />
            <input
              type={showConfirm ? "text" : "password"}
              required
              placeholder="Повторите новый пароль"
              value={values.passwordConfirm}
              onChange={(e) => setValues((prev) => ({ ...prev, passwordConfirm: e.target.value }))}
              className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)} className="text-slate-400 hover:text-slate-600 p-1">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
        <p className="text-xs font-bold text-slate-800">Требования к паролю:</p>
        <div className="space-y-1.5">
          {rules.map((rule) => (
            <div key={rule.title} className="flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 size={14} className={rule.isValid ? "text-emerald-600" : "text-slate-300"} />
              <span className={rule.isValid ? "text-slate-900 font-semibold" : "text-slate-400"}>{rule.title}</span>
            </div>
          ))}
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
            <span>Сохраняем...</span>
          </>
        ) : (
          <>
            <span>Сохранить новый пароль</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
};
