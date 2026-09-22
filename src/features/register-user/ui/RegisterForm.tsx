"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { authApi } from "@/entities/auth";
import { extractErrorMessage } from "@/shared/api";
import { normalizePhoneNumber } from "@/shared/lib/format/phone";
import { cn, ROUTES } from "@/shared/config";

const formatPhoneMask = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  let localDigits = digits;
  if (digits.startsWith("7") || digits.startsWith("8")) {
    localDigits = digits.slice(1);
  }
  localDigits = localDigits.slice(0, 10);

  let formatted = "+7";
  if (localDigits.length > 0) {
    formatted += " (" + localDigits.slice(0, 3);
  }
  if (localDigits.length >= 3) {
    formatted += ") ";
  }
  if (localDigits.length > 3) {
    formatted += localDigits.slice(3, 6);
  }
  if (localDigits.length >= 6) {
    formatted += "-";
  }
  if (localDigits.length > 6) {
    formatted += localDigits.slice(6, 8);
  }
  if (localDigits.length >= 8) {
    formatted += "-";
  }
  if (localDigits.length > 8) {
    formatted += localDigits.slice(8, 10);
  }
  return formatted;
};

export interface RegisterDraftData {
  name: string;
  phone: string;
  email: string;
  password: string;
  agreement: boolean;
  marketingConsent: boolean;
}

const initialValues: RegisterDraftData & { confirmPassword: string } = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreement: false,
  marketingConsent: false,
};

export const RegisterForm = () => {
  const [values, setValues] = useState(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  // Restore draft from sessionStorage if user clicked "back"
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("grocery_reg_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setValues((prev) => ({
          ...prev,
          name: parsed.name || "",
          phone: parsed.phone ? formatPhoneMask(parsed.phone) : "",
          email: parsed.email || "",
          password: parsed.password || "",
          confirmPassword: parsed.password || "",
          agreement: parsed.agreement ?? false,
          marketingConsent: parsed.marketingConsent ?? false,
        }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleChange = (field: string, value: any): void => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setErrorMessage(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    if (!digits || digits === "7" || digits === "8") {
      handleChange("phone", "");
      return;
    }
    const masked = formatPhoneMask(raw);
    handleChange("phone", masked);
  };

  // Live password matching check
  const hasConfirmPassword = values.confirmPassword.length > 0;
  const passwordsMatch = values.password === values.confirmPassword;
  const showPasswordMismatch = hasConfirmPassword && !passwordsMatch;

  // Check if all fields are valid for button activation
  const phoneDigits = values.phone.replace(/\D/g, "");
  const isEmailValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email.trim());
  const isFormComplete =
    values.name.trim().length >= 2 &&
    phoneDigits.length === 11 &&
    isEmailValid &&
    values.password.length >= 8 &&
    values.confirmPassword.length >= 8 &&
    passwordsMatch &&
    values.agreement;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const form = event.currentTarget;
    const name = ((form.elements.namedItem("name") as HTMLInputElement)?.value || values.name).trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value || values.phone;
    const email = ((form.elements.namedItem("email") as HTMLInputElement)?.value || values.email).trim().toLowerCase();
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value || values.password;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value || values.confirmPassword;
    const agreement = (form.querySelector("#reg-agreement") as HTMLInputElement)?.checked ?? values.agreement;
    const marketingConsent = (form.querySelector("#reg-marketing") as HTMLInputElement)?.checked ?? values.marketingConsent;

    const pDigits = phone.replace(/\D/g, "");
    const emailValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

    if (name.length < 2) {
      setErrorMessage("Имя должно содержать минимум 2 символа.");
      return;
    }
    if (pDigits.length < 11) {
      setErrorMessage("Введите номер телефона полностью в формате +7 (___) ___-__-__.");
      return;
    }
    if (!emailValid) {
      setErrorMessage("Электронная почта обязательна для регистрации. Укажите корректный email.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Пароль должен содержать не менее 8 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Пароли не совпадают. Пожалуйста, проверьте введённые данные.");
      return;
    }
    if (!agreement) {
      setErrorMessage("Необходимо принять соглашение на обработку персональных данных.");
      return;
    }

    try {
      setIsPending(true);
      setErrorMessage(null);

      const cleanPhone = normalizePhoneNumber(phone);

      // Step 1: Request OTP code via SMTP
      await authApi.sendRegisterOtp({
        email,
        phone: cleanPhone,
      });

      // Step 2: Save draft into sessionStorage
      const draft: RegisterDraftData = {
        name,
        phone: cleanPhone,
        email,
        password,
        agreement,
        marketingConsent,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("grocery_reg_draft", JSON.stringify(draft));
      }

      // Step 3: Navigate to dedicated OTP verification page without full reload
      router.push(ROUTES.REGISTER_VERIFY);
    } catch (err: any) {
      const message = extractErrorMessage(err, "Пользователь с таким телефоном или email уже существует");
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10"
      onSubmit={handleSubmit}
      noValidate
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
          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <UserRound size={17} className="text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              required
              name="name"
              placeholder="Иван Иванов"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-11 w-full bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Номер телефона <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <Phone size={17} className="text-slate-400 mr-2.5 shrink-0" />
            <input
              type="tel"
              required
              name="phone"
              placeholder="+7 (___) ___-__-__"
              maxLength={18}
              value={values.phone}
              onFocus={() => {
                if (!values.phone) {
                  handleChange("phone", "+7 (");
                }
              }}
              onBlur={() => {
                if (values.phone === "+7 (" || values.phone === "+7") {
                  handleChange("phone", "");
                }
              }}
              onChange={handlePhoneChange}
              className="h-11 w-full bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Электронная почта <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <Mail size={17} className="text-slate-400 mr-2.5 shrink-0" />
            <input
              type="email"
              required
              name="email"
              placeholder="ivan@example.com"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-11 w-full bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Пароль <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <LockKeyhole size={17} className="text-slate-400 mr-2.5 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                name="password"
                placeholder="Минимум 8 знаков"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="h-11 w-full bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Повторите пароль <span className="text-rose-500">*</span>
            </label>
            <div className={cn(
              "flex items-center rounded-xl border bg-white px-3.5 transition-all",
              showPasswordMismatch
                ? "border-rose-400 ring-2 ring-rose-400/20"
                : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"
            )}>
              <LockKeyhole size={17} className={cn("mr-2.5 shrink-0", showPasswordMismatch ? "text-rose-400" : "text-slate-400")} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                name="confirmPassword"
                placeholder="Повторите пароль"
                value={values.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className="h-11 w-full bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
              >
                {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {showPasswordMismatch ? (
              <p className="mt-1 text-xs font-semibold text-rose-600 animate-in fade-in-0 duration-150">
                Пароли не совпадают
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            id="reg-agreement"
            required
            checked={values.agreement}
            onChange={(e) => handleChange("agreement", e.target.checked)}
            className="mt-1 size-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 cursor-pointer"
          />
          <label htmlFor="reg-agreement" className="text-xs text-slate-600 leading-normal cursor-pointer select-none">
            <span className="text-rose-500 font-bold">* </span>
            Я даю{" "}
            <Link href={ROUTES.PERSONAL_DATA_CONSENT} className="text-emerald-600 font-semibold underline hover:text-emerald-700">
              согласие на обработку персональных данных
            </Link>{" "}
            и принимаю{" "}
            <Link href={ROUTES.OFFER} className="text-emerald-600 font-semibold underline hover:text-emerald-700">
              публичную оферту
            </Link>
          </label>
        </div>

        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            id="reg-marketing"
            checked={values.marketingConsent}
            onChange={(e) => handleChange("marketingConsent", e.target.checked)}
            className="mt-1 size-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 cursor-pointer"
          />
          <label htmlFor="reg-marketing" className="text-xs text-slate-500 leading-normal cursor-pointer select-none">
            Согласен получать информацию о скидках, персональных акциях и промокодах (38-ФЗ)
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 animate-in fade-in-0 duration-150">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!isFormComplete || isPending}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all",
          isFormComplete && !isPending
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/30 active:scale-[0.99] cursor-pointer"
            : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-60"
        )}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Отправка кода...</span>
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
