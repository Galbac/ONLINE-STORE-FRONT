"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const rules = useMemo(
    () => [
      {
        title: "Минимум 8 символов",
        isValid: values.password.length >= 8,
      },
      {
        title: "Хотя бы одну цифру",
        isValid: /\d/.test(values.password),
      },
      {
        title: "Хотя бы одну заглавную букву",
        isValid: /[A-ZА-ЯЁ]/.test(values.password),
      },
    ],
    [values.password],
  );

  const handleChange = (field: keyof ResetPasswordFormValues, value: string): void => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const validationMessage = validateForm(
      values,
      token,
      rules.every((rule) => rule.isValid),
    );

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setIsSuccess(false);
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
        setErrorMessage("Не удалось сбросить пароль. Проверьте ссылку или попробуйте позже.");
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
          label="Новый пароль"
          name="new_password"
          value={values.password}
          isVisible={isPasswordVisible}
          onToggleVisibility={() => setIsPasswordVisible((isVisible) => !isVisible)}
          onChange={(value) => handleChange("password", value)}
        />

        <PasswordField
          label="Подтверждение пароля"
          name="new_password_confirm"
          value={values.passwordConfirm}
          isVisible={isPasswordConfirmVisible}
          onToggleVisibility={() => setIsPasswordConfirmVisible((isVisible) => !isVisible)}
          onChange={(value) => handleChange("passwordConfirm", value)}
        />

        <div className="border-border bg-bg-secondary rounded-lg border p-6">
          <p className="mb-5 font-bold">Пароль должен содержать:</p>
          <ul className="space-y-4">
            {rules.map((rule) => (
              <li className="flex items-center gap-3 text-sm" key={rule.title}>
                <CheckCircle2
                  className={rule.isValid ? "text-success" : "text-text-muted"}
                  size={20}
                />
                <span>{rule.title}</span>
              </li>
            ))}
          </ul>
        </div>

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
          {isPending ? "Сбрасываем..." : "Сбросить пароль"}
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
              href={ROUTES.LOGIN}
            >
              Перейти ко входу
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
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}

const PasswordField = ({
  isVisible,
  label,
  name,
  onChange,
  onToggleVisibility,
  value,
}: PasswordFieldProps) => {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-bold">{label}</span>
      <span className="border-border focus-within:border-accent-primary flex h-14 items-center gap-3 rounded-lg border px-4 transition">
        <input
          className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
          autoComplete="new-password"
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
    </label>
  );
};

const validateForm = (
  values: ResetPasswordFormValues,
  token: string,
  arePasswordRulesValid: boolean,
): string | null => {
  if (!token) {
    return "Ссылка для сброса пароля недействительна: отсутствует token.";
  }

  if (!arePasswordRulesValid) {
    return "Пароль не соответствует требованиям.";
  }

  if (values.password !== values.passwordConfirm) {
    return "Пароли не совпадают.";
  }

  return null;
};
