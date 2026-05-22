"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";
import { storeAuthTokens } from "@/shared/ui";

interface RegisterFormValues {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
}

const initialValues: RegisterFormValues = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreement: false,
};

export const RegisterForm = () => {
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: keyof RegisterFormValues, value: string | boolean): void => {
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

        const response = await authApi.register({
          name: values.name.trim(),
          phone: values.phone.trim(),
          password: values.password,
          email: values.email.trim() || null,
        });

        storeAuthTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          remember: true,
        });

        await authApi.getMe(response.access_token);

        setSuccessMessage("Аккаунт создан. Вы вошли в систему.");
        setValues(initialValues);
      } catch {
        setErrorMessage("Не удалось зарегистрироваться. Проверьте данные или попробуйте позже.");
      }
    });
  };

  return (
    <form
      className="border-border bg-bg-primary space-y-6 rounded-lg border p-6 shadow-[0_14px_42px_rgb(28_43_22/0.08)] md:p-10"
      onSubmit={handleSubmit}
    >
      <FormField label="Имя">
        <TextInput
          autoComplete="name"
          icon={<UserRound size={20} />}
          name="name"
          placeholder="Введите ваше имя"
          type="text"
          value={values.name}
          onChange={(value) => handleChange("name", value)}
        />
      </FormField>

      <FormField label="Телефон">
        <TextInput
          autoComplete="tel"
          icon={<Phone size={20} />}
          name="phone"
          placeholder="+7 (___) ___-__-__"
          type="tel"
          value={values.phone}
          onChange={(value) => handleChange("phone", value)}
        />
      </FormField>

      <FormField label="Email">
        <TextInput
          autoComplete="email"
          icon={<Mail size={20} />}
          name="email"
          placeholder="Введите ваш email"
          type="email"
          value={values.email}
          onChange={(value) => handleChange("email", value)}
        />
      </FormField>

      <FormField label="Пароль">
        <PasswordInput
          autoComplete="new-password"
          name="password"
          placeholder="Введите пароль"
          showPassword={showPassword}
          value={values.password}
          onChange={(value) => handleChange("password", value)}
          onToggleVisibility={() => setShowPassword((isVisible) => !isVisible)}
        />
      </FormField>

      <FormField label="Подтверждение пароля">
        <PasswordInput
          autoComplete="new-password"
          name="confirmPassword"
          placeholder="Повторите пароль"
          showPassword={showConfirmPassword}
          value={values.confirmPassword}
          onChange={(value) => handleChange("confirmPassword", value)}
          onToggleVisibility={() => setShowConfirmPassword((isVisible) => !isVisible)}
        />
      </FormField>

      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          className="border-border mt-1 size-5 rounded accent-[var(--color-accent-primary)]"
          checked={values.agreement}
          type="checkbox"
          onChange={(event) => handleChange("agreement", event.target.checked)}
        />
        <span>
          Я согласен с правилами обработки персональных данных и{" "}
          <Link className="text-accent-primary hover:text-accent-hover" href="#">
            пользовательским соглашением
          </Link>
        </span>
      </label>

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
        Зарегистрироваться
      </button>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
        <span className="bg-border h-px" />
        <span className="text-text-secondary text-sm">Уже есть аккаунт?</span>
        <span className="bg-border h-px" />
      </div>

      <Link
        className="text-accent-primary hover:text-accent-hover block text-center text-lg font-bold"
        href={ROUTES.LOGIN}
      >
        Войти
      </Link>
    </form>
  );
};

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

const FormField = ({ children, label }: FormFieldProps) => {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
};

interface TextInputProps {
  autoComplete: string;
  icon: React.ReactNode;
  name: string;
  placeholder: string;
  type: "email" | "tel" | "text";
  value: string;
  onChange: (value: string) => void;
}

const TextInput = ({
  autoComplete,
  icon,
  name,
  onChange,
  placeholder,
  type,
  value,
}: TextInputProps) => {
  return (
    <span className="border-border focus-within:border-accent-primary flex h-14 items-center gap-3 rounded-lg border px-4 transition">
      <input
        className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
        autoComplete={autoComplete}
        name={name}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="text-text-muted shrink-0">{icon}</span>
    </span>
  );
};

interface PasswordInputProps {
  autoComplete: string;
  name: string;
  placeholder: string;
  showPassword: boolean;
  value: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}

const PasswordInput = ({
  autoComplete,
  name,
  onChange,
  onToggleVisibility,
  placeholder,
  showPassword,
  value,
}: PasswordInputProps) => {
  return (
    <span className="border-border focus-within:border-accent-primary flex h-14 items-center gap-3 rounded-lg border px-4 transition">
      <input
        className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
        autoComplete={autoComplete}
        name={name}
        placeholder={placeholder}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <LockKeyhole className="text-text-muted shrink-0" size={19} />
      <button
        className="text-text-muted hover:text-text-primary shrink-0 transition"
        type="button"
        onClick={onToggleVisibility}
        aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
      >
        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </span>
  );
};

const validateForm = (values: RegisterFormValues): string | null => {
  if (values.name.trim().length < 2) {
    return "Введите имя не короче 2 символов.";
  }

  if (values.phone.trim().length < 5) {
    return "Введите телефон.";
  }

  if (values.email.trim() && !values.email.includes("@")) {
    return "Введите корректный email.";
  }

  if (values.password.length < 8) {
    return "Пароль должен быть не короче 8 символов.";
  }

  if (values.password !== values.confirmPassword) {
    return "Пароли не совпадают.";
  }

  if (!values.agreement) {
    return "Подтвердите согласие с правилами.";
  }

  return null;
};
