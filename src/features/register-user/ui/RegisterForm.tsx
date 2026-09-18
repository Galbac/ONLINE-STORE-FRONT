"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { normalizePhoneNumber } from "@/shared/lib/format/phone";
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
  agreement: true,
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
          email: values.email.trim() || null,
          name: values.name.trim(),
          password: values.password,
          phone: normalizePhoneNumber(values.phone),
        });

        storeAuthTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          remember: true,
        });

        await authApi.getMe(response.access_token);

        setSuccessMessage("Регистрация успешна! Добро пожаловать.");
        setValues(initialValues);
        window.location.href = ROUTES.PROFILE;
      } catch {
        setErrorMessage("Не удалось зарегистрироваться. Пользователь с таким телефоном или email уже существует.");
      }
    });
  };

  return (
    <form
      className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">Создание аккаунта</h2>
        <p className="mt-1 text-xs text-slate-500">Заполните данные для начисления кэшбэка и быстрой доставки</p>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Ваше имя <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <UserRound size={17} className="text-slate-400 mr-2.5" />
            <input
              type="text"
              required
              name="name"
              placeholder="Иван Иванов"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Номер телефона <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <Phone size={17} className="text-slate-400 mr-2.5" />
            <input
              type="tel"
              required
              name="phone"
              placeholder="+7 (999) 000-00-00"
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Электронная почта
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <Mail size={17} className="text-slate-400 mr-2.5" />
            <input
              type="email"
              name="email"
              placeholder="ivan@example.com"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Пароль <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <LockKeyhole size={17} className="text-slate-400 mr-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                name="password"
                placeholder="Минимум 8 знаков"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Повторите пароль <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <LockKeyhole size={17} className="text-slate-400 mr-2.5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                name="confirmPassword"
                placeholder="Повторите"
                value={values.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className="h-11 w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="reg-agreement"
          required
          checked={values.agreement}
          onChange={(e) => handleChange("agreement", e.target.checked)}
          className="mt-1 size-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 cursor-pointer"
        />
        <label htmlFor="reg-agreement" className="text-xs text-slate-500 leading-normal cursor-pointer select-none">
          Я согласен с{" "}
          <Link href={ROUTES.PERSONAL_DATA_CONSENT} className="text-emerald-600 underline">
            условиями обработки персональных данных
          </Link>{" "}
          и{" "}
          <Link href={ROUTES.OFFER} className="text-emerald-600 underline">
            публичной офертой
          </Link>
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
        type="submit"
        disabled={isPending}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30 active:scale-[0.99] transition-all disabled:opacity-60",
          isPending && "cursor-wait opacity-75",
        )}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Регистрация...</span>
          </>
        ) : (
          <>
            <span>Зарегистрироваться</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>

      <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        Уже есть аккаунт?{" "}
        <Link href={ROUTES.LOGIN} className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
          Войти
        </Link>
      </div>
    </form>
  );
};

const validateForm = (values: RegisterFormValues): string | null => {
  if (values.name.trim().length < 2) {
    return "Имя должно содержать минимум 2 символа.";
  }
  if (!values.phone.trim()) {
    return "Введите корректный номер телефона.";
  }
  if (values.password.length < 8) {
    return "Пароль должен содержать не менее 8 символов.";
  }
  if (values.password !== values.confirmPassword) {
    return "Пароли не совпадают.";
  }
  if (!values.agreement) {
    return "Необходимо принять соглашение на обработку персональных данных.";
  }
  return null;
};
