"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { adminAuthApi } from "@/entities/admin-auth";
import { AdminApiError, storeAdminAuthTokens } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";

interface AdminLoginFormValues {
  login: string;
  password: string;
  rememberMe: boolean;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}

const initialValues: AdminLoginFormValues = {
  login: "",
  password: "",
  rememberMe: false,
};

export const AdminLoginForm = () => {
  const router = useRouter();
  const [values, setValues] = useState<AdminLoginFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: keyof AdminLoginFormValues, value: string | boolean): void => {
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

        const response = await adminAuthApi.login({
          login: values.login.trim(),
          password: values.password,
        });

        storeAdminAuthTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          remember: values.rememberMe,
        });

        await adminAuthApi.getMe(response.access_token);

        setValues(initialValues);
        setSuccessMessage("Доступ подтвержден.");

        window.location.href = ROUTES.ADMIN_DASHBOARD;
      } catch (error) {
        setSuccessMessage(null);
        setErrorMessage(getAuthErrorMessage(error));
      }
    });
  };

  return (
    <form
      className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-9"
      onSubmit={handleSubmit}
    >
      {/* Шапка формы с элегантной иконкой */}
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
          <ShieldCheck size={26} strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
          Вход в админку
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Доступ для сотрудников магазина
        </p>
      </div>

      {/* Поля ввода */}
      <div className="space-y-4">
        <FormField label="Email или телефон" required>
          <div className="group relative flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition-all duration-200 hover:border-slate-300 hover:bg-white focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              autoComplete="username"
              name="login"
              placeholder="Введите email или телефон"
              type="text"
              value={values.login}
              onChange={(event) => handleChange("login", event.target.value)}
            />
            <UserRound className="text-slate-400 transition-colors group-focus-within:text-emerald-600 shrink-0" size={18} />
          </div>
        </FormField>

        <FormField label="Пароль" required>
          <div className="group relative flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition-all duration-200 hover:border-slate-300 hover:bg-white focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              autoComplete="current-password"
              name="password"
              placeholder="Введите пароль"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
            <LockKeyhole className="text-slate-400 transition-colors group-focus-within:text-emerald-600 shrink-0" size={18} />
            <button
              className="text-slate-400 transition-colors hover:text-slate-700 shrink-0 cursor-pointer p-0.5"
              type="button"
              onClick={() => setShowPassword((isVisible) => !isVisible)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </FormField>
      </div>

      {/* Запомнить этот браузер */}
      <label className="mt-4 flex cursor-pointer items-center gap-2.5 select-none text-sm text-slate-600 transition-colors hover:text-slate-900">
        <input
          className="size-4 rounded border-slate-300 text-emerald-600 transition focus:ring-emerald-500/20"
          checked={values.rememberMe}
          type="checkbox"
          onChange={(event) => handleChange("rememberMe", event.target.checked)}
        />
        <span>Запомнить этот браузер</span>
      </label>

      {/* Сообщения об ошибках / успехе */}
      {errorMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-700 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      ) : null}
      {successMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 text-xs font-medium text-emerald-700 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* Кнопка отправки: Войти */}
      <button
        className={cn(
          "mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
          isPending && "cursor-wait opacity-80",
        )}
        type="submit"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Вход...</span>
          </>
        ) : (
          "Войти"
        )}
      </button>
    </form>
  );
};

const FormField = ({ children, label, required = false }: FormFieldProps) => {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
};

const validateForm = (values: AdminLoginFormValues): string | null => {
  if (values.login.trim().length < 3) {
    return "Введите email или телефон.";
  }

  if (values.password.length < 1) {
    return "Введите пароль.";
  }

  return null;
};

const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof AdminApiError && error.status === 422) {
    return "Проверьте формат email, телефона и пароля.";
  }

  if (error instanceof AdminApiError && error.status === 403) {
    return "У этой учетной записи нет доступа к админке.";
  }

  return "Не удалось войти. Проверьте email, телефон или пароль.";
};
