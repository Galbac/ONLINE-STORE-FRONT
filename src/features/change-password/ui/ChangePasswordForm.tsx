"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

type PasswordFieldName = keyof ChangePasswordFormValues;

const initialValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  newPasswordConfirm: "",
};

export const ChangePasswordForm = () => {
  const [values, setValues] = useState<ChangePasswordFormValues>(initialValues);
  const [visibleFields, setVisibleFields] = useState<Record<PasswordFieldName, boolean>>({
    currentPassword: false,
    newPassword: false,
    newPasswordConfirm: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: PasswordFieldName, value: string): void => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleToggleVisibility = (field: PasswordFieldName): void => {
    setVisibleFields((currentFields) => ({
      ...currentFields,
      [field]: !currentFields[field],
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const validationMessage = validateForm(values);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setIsSuccess(false);
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);

        const accessToken =
          window.localStorage.getItem("access_token") ??
          window.sessionStorage.getItem("access_token");

        await authApi.changePassword(
          {
            current_password: values.currentPassword,
            new_password: values.newPassword,
            new_password_confirm: values.newPasswordConfirm,
          },
          accessToken,
        );

        setValues(initialValues);
        setIsSuccess(true);
      } catch {
        setErrorMessage("Не удалось изменить пароль. Проверьте старый пароль и попробуйте снова.");
        setIsSuccess(false);
      }
    });
  };

  return (
    <div className="mx-auto max-w-[790px]">
      <form
        className="border-border bg-bg-primary space-y-8 rounded-lg border p-6 shadow-[0_14px_42px_rgb(28_43_22/0.08)] md:p-12"
        onSubmit={handleSubmit}
      >
        <PasswordField
          label="Старый пароль"
          name="current_password"
          value={values.currentPassword}
          isVisible={visibleFields.currentPassword}
          onChange={(value) => handleChange("currentPassword", value)}
          onToggleVisibility={() => handleToggleVisibility("currentPassword")}
        />

        <PasswordField
          hint="Минимум 8 символов, хотя бы одна цифра и одна заглавная буква."
          label="Новый пароль"
          name="new_password"
          value={values.newPassword}
          isVisible={visibleFields.newPassword}
          onChange={(value) => handleChange("newPassword", value)}
          onToggleVisibility={() => handleToggleVisibility("newPassword")}
        />

        <PasswordField
          label="Подтверждение нового пароля"
          name="new_password_confirm"
          value={values.newPasswordConfirm}
          isVisible={visibleFields.newPasswordConfirm}
          onChange={(value) => handleChange("newPasswordConfirm", value)}
          onToggleVisibility={() => handleToggleVisibility("newPasswordConfirm")}
        />

        {errorMessage ? (
          <p className="text-error rounded-lg bg-red-50 px-4 py-3 text-sm">{errorMessage}</p>
        ) : null}

        <button
          className={cn(
            "bg-accent-primary text-accent-contrast hover:bg-accent-hover h-16 w-full rounded-lg text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-65",
            isPending && "cursor-wait opacity-75",
          )}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Изменяем..." : "Изменить пароль"}
        </button>
      </form>

      {isSuccess ? (
        <div className="border-success/25 bg-bg-secondary mt-16 flex items-center gap-7 rounded-lg border p-8 md:p-10">
          <span className="bg-success text-accent-contrast grid size-16 shrink-0 place-items-center rounded-full">
            <Check size={38} />
          </span>
          <div>
            <p className="text-text-primary text-lg font-bold">Пароль успешно изменён</p>
            <p className="text-text-secondary mt-3">
              Теперь вы можете войти в аккаунт с новым паролем.
            </p>
            <Link
              className="text-accent-primary hover:text-accent-hover mt-5 inline-block font-bold transition"
              href={ROUTES.PROFILE}
            >
              Перейти в профиль
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  isVisible: boolean;
  hint?: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}

const PasswordField = ({
  hint,
  isVisible,
  label,
  name,
  onChange,
  onToggleVisibility,
  value,
}: PasswordFieldProps) => {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-bold">
        {label} <span className="text-error">*</span>
      </span>
      <span className="border-border focus-within:border-accent-primary flex h-14 items-center gap-3 rounded-lg border px-4 transition">
        <input
          className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
          autoComplete={name === "current_password" ? "current-password" : "new-password"}
          name={name}
          placeholder="Введите пароль"
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <LockKeyhole className="text-text-muted shrink-0" size={19} />
        <button
          className="text-text-muted hover:text-text-primary shrink-0 transition"
          type="button"
          onClick={onToggleVisibility}
          aria-label={isVisible ? "Скрыть пароль" : "Показать пароль"}
        >
          {isVisible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </span>
      {hint ? <span className="text-text-secondary mt-3 block text-sm">{hint}</span> : null}
    </label>
  );
};

const validateForm = (values: ChangePasswordFormValues): string | null => {
  if (!values.currentPassword) {
    return "Введите старый пароль.";
  }

  if (values.newPassword.length < 8) {
    return "Новый пароль должен быть не короче 8 символов.";
  }

  if (!/\d/.test(values.newPassword) || !/[A-ZА-ЯЁ]/.test(values.newPassword)) {
    return "Новый пароль должен содержать цифру и заглавную букву.";
  }

  if (values.currentPassword === values.newPassword) {
    return "Новый пароль должен отличаться от старого.";
  }

  if (values.newPassword !== values.newPasswordConfirm) {
    return "Пароли не совпадают.";
  }

  return null;
};
