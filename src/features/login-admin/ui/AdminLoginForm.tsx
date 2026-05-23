"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
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

        router.replace(ROUTES.ADMIN_DASHBOARD);
        router.refresh();
      } catch (error) {
        setSuccessMessage(null);
        setErrorMessage(getAuthErrorMessage(error));
      }
    });
  };

  return (
    <form
      className="border-border bg-bg-primary w-full rounded-lg border p-5 shadow-soft sm:p-7 md:p-8"
      onSubmit={handleSubmit}
    >
      <div className="mb-8 flex items-center gap-4">
        <span className="bg-bg-hover text-accent-primary grid size-12 shrink-0 place-items-center rounded-lg border border-green-100">
          <ShieldCheck size={25} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Вход в админку</h1>
          <p className="text-text-secondary mt-2 text-sm">Доступ для сотрудников магазина</p>
        </div>
      </div>

      <div className="space-y-5">
        <FormField label="Email или телефон" required>
          <span className="border-border focus-within:border-accent-primary flex h-13 items-center gap-3 rounded-lg border px-4 transition">
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              autoComplete="username"
              name="login"
              placeholder="Введите email или телефон"
              type="text"
              value={values.login}
              onChange={(event) => handleChange("login", event.target.value)}
            />
            <UserRound className="text-text-muted shrink-0" size={19} />
          </span>
        </FormField>

        <FormField label="Пароль" required>
          <span className="border-border focus-within:border-accent-primary flex h-13 items-center gap-3 rounded-lg border px-4 transition">
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              autoComplete="current-password"
              name="password"
              placeholder="Введите пароль"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
            <LockKeyhole className="text-text-muted shrink-0" size={18} />
            <button
              className="text-text-muted hover:text-text-primary shrink-0 transition"
              type="button"
              onClick={() => setShowPassword((isVisible) => !isVisible)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </FormField>
      </div>

      <label className="mt-5 flex items-center gap-3 text-sm text-text-secondary">
        <input
          className="border-border size-5 rounded accent-[var(--color-accent-primary)]"
          checked={values.rememberMe}
          type="checkbox"
          onChange={(event) => handleChange("rememberMe", event.target.checked)}
        />
        Запомнить этот браузер
      </label>

      {errorMessage ? (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-error">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-success">
          {successMessage}
        </p>
      ) : null}

      <button
        className={cn(
          "bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-7 h-13 w-full rounded-lg text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-65",
          isPending && "cursor-wait opacity-75",
        )}
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Проверяем доступ..." : "Войти в админку"}
      </button>
    </form>
  );
};

const FormField = ({ children, label, required = false }: FormFieldProps) => {
  return (
    <label className="block">
      <span className="mb-2.5 block text-sm font-bold">
        {label} {required ? <span className="text-error">*</span> : null}
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
