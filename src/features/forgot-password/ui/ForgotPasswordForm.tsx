"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";

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

    const validationMessage = validateForm(values);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setIsSent(false);
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);

        await authApi.forgotPassword({
          login: values.login.trim(),
        });

        setIsSent(true);
      } catch {
        setErrorMessage("Не удалось отправить инструкцию. Проверьте email или телефон.");
        setIsSent(false);
      }
    });
  };

  return (
    <div>
      <form
        className="border-border bg-bg-primary rounded-lg border p-6 shadow-[0_14px_42px_rgb(28_43_22/0.08)] md:p-8"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="mb-3 block text-sm font-bold">Email или телефон</span>
          <span className="border-border focus-within:border-accent-primary flex h-16 items-center gap-3 rounded-lg border px-5 transition">
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-base outline-none"
              autoComplete="username"
              name="login"
              placeholder="ivan@example.com"
              type="text"
              value={values.login}
              onChange={(event) => {
                setValues({ login: event.target.value });
              }}
            />
            <UserRound className="text-text-muted shrink-0" size={20} />
          </span>
        </label>

        <p className="text-text-secondary mt-4 text-sm">
          Введите email или номер телефона, указанный при регистрации
        </p>

        {errorMessage ? (
          <p className="text-error mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm">{errorMessage}</p>
        ) : null}

        <button
          className={cn(
            "bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-8 h-16 w-full rounded-lg text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-65",
            isPending && "cursor-wait opacity-75",
          )}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Отправляем..." : "Отправить инструкцию"}
        </button>

        <Link
          className="text-accent-primary hover:text-accent-hover mt-8 inline-flex items-center gap-2 font-medium transition"
          href={ROUTES.LOGIN}
        >
          <ArrowLeft size={18} />
          Вернуться ко входу
        </Link>
      </form>

      {isSent ? (
        <div className="border-success/25 bg-bg-secondary mt-12 flex items-center gap-7 rounded-lg border p-8 md:p-10">
          <span className="bg-success text-accent-contrast grid size-16 shrink-0 place-items-center rounded-full">
            <Check size={38} />
          </span>
          <p className="text-text-secondary text-base md:text-lg">
            Если пользователь найден, инструкция по восстановлению пароля будет отправлена
          </p>
        </div>
      ) : null}
    </div>
  );
};

const validateForm = (values: ForgotPasswordFormValues): string | null => {
  if (values.login.trim().length < 3) {
    return "Введите email или телефон.";
  }

  return null;
};
