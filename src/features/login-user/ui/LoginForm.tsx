"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { extractErrorMessage } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { handlePhoneInputChange, normalizePhoneNumber } from "@/shared/lib/format/phone";
import { storeAuthTokens } from "@/shared/ui";

interface LoginFormValues {
  login: string;
  password: string;
  rememberMe: boolean;
}

const initialValues: LoginFormValues = {
  login: "",
  password: "",
  rememberMe: true,
};

type LoginStatus = "idle" | "submitting" | "success";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("idle");

  const isLoading = status === "submitting" || status === "success";

  const handleChange = (field: keyof LoginFormValues, value: string | boolean): void => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isLoading) return;

    const validationMessage = validateForm(values);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage(null);
    setStatus("submitting");

    try {
      const trimmedLogin = values.login.trim();
      const loginToSubmit = trimmedLogin.includes("@")
        ? trimmedLogin.toLowerCase()
        : normalizePhoneNumber(trimmedLogin);

      const response = await authApi.login({
        login: loginToSubmit,
        password: values.password,
      });

      storeAuthTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        remember: values.rememberMe,
      });

      try {
        await authApi.getMe(response.access_token);
      } catch (_) {}

      setStatus("success");

      const targetUrl = getSafeNextPath(searchParams.get("next"));
      // Мгновенный переход без очистки полей и без дергания интерфейса
      window.location.assign(targetUrl);
    } catch (err: any) {
      setStatus("idle");
      setErrorMessage(extractErrorMessage(err, "Неверный email, телефон или пароль."));
    }
  };

  return (
    <form
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10 transition-all"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">Вход для клиентов</h2>
        <p className="mt-1 text-xs text-slate-500">Войдите, чтобы использовать сохраненные адреса и бонусы</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Email или номер телефона <span className="text-rose-500">*</span>
          </label>
          <div
            className={cn(
              "relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10",
              isLoading && "bg-slate-50/70 opacity-80 cursor-not-allowed",
              errorMessage && "border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-500/10",
            )}
          >
            <UserRound className="text-slate-400 shrink-0 mr-2.5" size={18} />
            <input
              className="h-12 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed"
              autoComplete="username"
              name="login"
              disabled={isLoading}
              placeholder="user@example.com или +7 (___) ___-__-__"
              type="text"
              value={values.login}
              onChange={(event) => {
                const val = event.target.value;
                if (!val.includes("@") && (/^\+?\d/.test(val) || val.startsWith("+"))) {
                  handleChange("login", handlePhoneInputChange(val, values.login));
                } else {
                  handleChange("login", val);
                }
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Пароль <span className="text-rose-500">*</span>
            </label>
            <Link
              className={cn(
                "text-xs font-bold text-emerald-600 hover:text-emerald-700 transition",
                isLoading && "pointer-events-none opacity-50",
              )}
              href={ROUTES.FORGOT_PASSWORD}
            >
              Забыли пароль?
            </Link>
          </div>
          <div
            className={cn(
              "relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10",
              isLoading && "bg-slate-50/70 opacity-80 cursor-not-allowed",
              errorMessage && "border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-500/10",
            )}
          >
            <LockKeyhole className="text-slate-400 shrink-0 mr-2.5" size={18} />
            <input
              className="h-12 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed"
              autoComplete="current-password"
              name="password"
              disabled={isLoading}
              placeholder="Введите ваш пароль"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
            <button
              className="text-slate-400 hover:text-slate-700 shrink-0 p-1 transition disabled:cursor-not-allowed"
              type="button"
              disabled={isLoading}
              onClick={() => setShowPassword((isVisible) => !isVisible)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <label
          className={cn(
            "flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none",
            isLoading && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
            checked={values.rememberMe}
            disabled={isLoading}
            type="checkbox"
            onChange={(event) => handleChange("rememberMe", event.target.checked)}
          />
          Запомнить меня на этом устройстве
        </label>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 animate-in fade-in-0 duration-150">
          {errorMessage}
        </div>
      ) : null}

      <p className="text-[11px] text-center text-slate-400 leading-relaxed px-1">
        Нажимая «Войти», вы соглашаетесь с{" "}
        <Link className="underline hover:text-emerald-700" href="/terms" target="_blank">
          условиями Оферты
        </Link>{" "}
        и{" "}
        <Link className="underline hover:text-emerald-700" href="/privacy" target="_blank">
          Политикой обработки персональных данных (152-ФЗ)
        </Link>
      </p>

      <button
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all duration-200 select-none",
          status === "idle" &&
            "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30 active:scale-[0.99] cursor-pointer",
          status === "submitting" &&
            "bg-emerald-600 shadow-emerald-600/20 cursor-wait opacity-90",
          status === "success" &&
            "bg-emerald-600 shadow-emerald-600/25 cursor-wait opacity-95",
        )}
        type="submit"
        disabled={isLoading}
      >
        {status === "submitting" && (
          <>
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>Входим...</span>
          </>
        )}
        {status === "success" && (
          <>
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>Перенаправляем...</span>
          </>
        )}
        {status === "idle" && (
          <span>Войти</span>
        )}
      </button>

      <div className="border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
        Впервые у нас?{" "}
        <Link
          className={cn(
            "font-bold text-emerald-600 hover:text-emerald-700 hover:underline",
            isLoading && "pointer-events-none opacity-50",
          )}
          href={ROUTES.REGISTER}
        >
          Создать аккаунт
        </Link>
      </div>
    </form>
  );
};

const getSafeNextPath = (nextPath: string | null): string => {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return ROUTES.PROFILE;
  }
  return nextPath;
};

const validateForm = (values: LoginFormValues): string | null => {
  const loginTrimmed = values.login.trim();
  const passwordTrimmed = values.password;

  if (!loginTrimmed && !passwordTrimmed) {
    return "Заполните email или номер телефона и введите пароль.";
  }
  if (!loginTrimmed) {
    return "Введите email или номер телефона.";
  }
  if (loginTrimmed.length < 3) {
    return "Введите корректный email или номер телефона.";
  }
  if (!passwordTrimmed) {
    return "Введите пароль.";
  }
  return null;
};
