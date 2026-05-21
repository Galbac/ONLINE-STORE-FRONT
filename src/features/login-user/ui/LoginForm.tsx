"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";

interface LoginFormValues {
  login: string;
  password: string;
  rememberMe: boolean;
}

const initialValues: LoginFormValues = {
  login: "",
  password: "",
  rememberMe: false,
};

const socialProviders = ["vk", "ok", "G", "apple"] as const;

export const LoginForm = () => {
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

        const refreshedTokens = await authApi
          .refresh({
            refresh_token: response.refresh_token,
          })
          .catch(() => ({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: response.token_type,
          }));

        const storage = values.rememberMe ? window.localStorage : window.sessionStorage;

        storage.setItem("access_token", refreshedTokens.access_token);
        storage.setItem("refresh_token", refreshedTokens.refresh_token);

        await authApi.getMe(refreshedTokens.access_token);

        setSuccessMessage("Вы вошли в аккаунт.");
        setValues(initialValues);
      } catch {
        setErrorMessage("Не удалось войти. Проверьте email, телефон или пароль.");
      }
    });
  };

  return (
    <form
      className="border-border bg-bg-primary space-y-8 rounded-lg border p-6 shadow-[0_14px_42px_rgb(28_43_22/0.08)] md:p-10"
      onSubmit={handleSubmit}
    >
      <FormField label="Email или телефон" required>
        <span className="border-border focus-within:border-accent-primary flex h-14 items-center gap-3 rounded-lg border px-4 transition">
          <input
            className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
            autoComplete="username"
            name="login"
            placeholder="Введите email или телефон"
            type="text"
            value={values.login}
            onChange={(event) => handleChange("login", event.target.value)}
          />
          <UserRound className="text-text-muted shrink-0" size={20} />
        </span>
      </FormField>

      <FormField label="Пароль" required>
        <span className="border-border focus-within:border-accent-primary flex h-14 items-center gap-3 rounded-lg border px-4 transition">
          <input
            className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
            autoComplete="current-password"
            name="password"
            placeholder="Введите пароль"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
          <LockKeyhole className="text-text-muted shrink-0" size={19} />
          <button
            className="text-text-muted hover:text-text-primary shrink-0 transition"
            type="button"
            onClick={() => setShowPassword((isVisible) => !isVisible)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </span>
      </FormField>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-sm">
          <input
            className="border-border size-5 rounded accent-[var(--color-accent-primary)]"
            checked={values.rememberMe}
            type="checkbox"
            onChange={(event) => handleChange("rememberMe", event.target.checked)}
          />
          Запомнить меня
        </label>
        <Link
          className="text-accent-primary hover:text-accent-hover text-sm font-bold"
          href={ROUTES.FORGOT_PASSWORD}
        >
          Забыли пароль?
        </Link>
      </div>

      {errorMessage ? (
        <p className="text-error rounded-lg bg-red-50 px-4 py-3 text-sm">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-success rounded-lg bg-green-50 px-4 py-3 text-sm">{successMessage}</p>
      ) : null}

      <button
        className={cn(
          "bg-accent-primary text-accent-contrast hover:bg-accent-hover h-14 w-full rounded-lg text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-65",
          isPending && "cursor-wait opacity-75",
        )}
        type="submit"
        disabled={isPending}
      >
        Войти
      </button>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
        <span className="bg-border h-px" />
        <span className="text-text-secondary text-sm">или войдите с помощью</span>
        <span className="bg-border h-px" />
      </div>

      <div className="flex flex-wrap justify-center gap-5">
        {socialProviders.map((provider) => (
          <button
            className="border-border hover:bg-bg-hover grid h-14 w-24 place-items-center rounded-lg border text-xl font-bold transition"
            type="button"
            key={provider}
            aria-label={`Войти через ${provider}`}
          >
            {provider === "apple" ? "" : provider}
          </button>
        ))}
      </div>

      <div className="bg-border h-px" />

      <p className="text-text-secondary text-center">
        Ещё нет аккаунта?{" "}
        <Link
          className="text-accent-primary hover:text-accent-hover font-bold"
          href={ROUTES.REGISTER}
        >
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
};

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField = ({ children, label, required = false }: FormFieldProps) => {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-bold">
        {label} {required ? <span className="text-error">*</span> : null}
      </span>
      {children}
    </label>
  );
};

const validateForm = (values: LoginFormValues): string | null => {
  if (values.login.trim().length < 3) {
    return "Введите email или телефон.";
  }

  if (values.password.length < 1) {
    return "Введите пароль.";
  }

  return null;
};
