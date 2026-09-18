"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";
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

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: keyof LoginFormValues, value: string | boolean): void => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const validationMessage = validateForm(values);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage(null);
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);

        const response = await authApi.login({
          login: values.login.trim(),
          password: values.password,
        });

        storeAuthTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          remember: values.rememberMe,
        });

        await authApi.getMe(response.access_token);

        setSuccessMessage("Вы успешно вошли в аккаунт.");
        setValues(initialValues);
        router.replace(getSafeNextPath(searchParams.get("next")));
        router.refresh();
      } catch {
        setErrorMessage("Не удалось войти. Проверьте email, телефон или пароль.");
      }
    });
  };

  return (
    <form
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10"
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
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
            <UserRound className="text-slate-400 shrink-0 mr-2.5" size={18} />
            <input
              className="h-12 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              autoComplete="username"
              name="login"
              placeholder="user@example.com или +7 999 000-00-00"
              type="text"
              value={values.login}
              onChange={(event) => handleChange("login", event.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Пароль <span className="text-rose-500">*</span>
            </label>
            <Link
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              href={ROUTES.FORGOT_PASSWORD}
            >
              Забыли пароль?
            </Link>
          </div>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
            <LockKeyhole className="text-slate-400 shrink-0 mr-2.5" size={18} />
            <input
              className="h-12 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              autoComplete="current-password"
              name="password"
              placeholder="Введите ваш пароль"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
            <button
              className="text-slate-400 hover:text-slate-700 shrink-0 p-1 transition"
              type="button"
              onClick={() => setShowPassword((isVisible) => !isVisible)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none">
          <input
            className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
            checked={values.rememberMe}
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

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 animate-in fade-in-0 duration-150">
          {successMessage}
        </div>
      ) : null}

      <button
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30 active:scale-[0.99] transition-all disabled:opacity-60",
          isPending && "cursor-wait opacity-75",
        )}
        type="submit"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Входим...</span>
          </>
        ) : (
          <>
            <span>Войти в аккаунт</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>

      <div className="border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
        Впервые у нас?{" "}
        <Link
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
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
  if (values.login.trim().length < 3) {
    return "Введите корректный email или телефон.";
  }
  if (values.password.length < 1) {
    return "Введите пароль.";
  }
  return null;
};
