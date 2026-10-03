"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Save, CreditCard, ShieldCheck, Info } from "lucide-react";

import {
  adminSettingsApi,
  type AdminSettingsPayload,
  type AdminSettingsResponse,
  type DayScheduleItem,
} from "@/entities/admin-settings";
import { AdminApiError } from "@/shared/api";
import { localizeErrorMessage } from "@/shared/lib/format";
import { notifySettingsUpdated } from "@/entities/settings";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";
import { formatPhoneMask, handlePhoneInputChange, normalizePhoneNumber } from "@/shared/lib/format/phone";

interface AdminSettingsViewProps {
  settings: AdminSettingsResponse;
}

export const AdminSettingsView = ({ settings: initialSettings }: AdminSettingsViewProps) => {
  const [settings, setSettings] = useState(initialSettings);
  const [schedule, setSchedule] = useState<DayScheduleItem[] | null>(initialSettings.schedule ?? null);
  const [workingHours, setWorkingHours] = useState<string>(initialSettings.working_hours ?? "");
  const [paymentProvider, setPaymentProvider] = useState<string>(initialSettings.payment_provider || "yookassa");
  const [robokassaIsTest, setRobokassaIsTest] = useState<boolean>(Boolean(initialSettings.robokassa_is_test));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setMessage(null);
    setError(null);

    const payload = getSettingsPayload(formData, settings, schedule);

    if (Object.keys(payload).length === 0) {
      setIsPending(false);
      setMessage("Нет изменений для сохранения.");
      return;
    }

    void adminSettingsApi
      .update(payload)
      .then((response) => {
        setSettings(response);
        if (response.schedule) setSchedule(response.schedule);
        if (response.working_hours) setWorkingHours(response.working_hours);
        setMessage("Общие настройки сохранены.");
        notifySettingsUpdated();
      })
      .catch((updateError: unknown) => {
        setError(getSettingsErrorMessage(updateError));
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Общие настройки</h1>
        <p className="text-text-secondary mt-2">
          Данные магазина, график работы по дням недели, способы получения и оплаты, минимальная сумма заказа.
        </p>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Магазин" value={settings.shop_name} />
        <SummaryCard label="Город" value={settings.default_city ?? "Не указан"} />
        <SummaryCard label="Режим работы" value={workingHours || settings.working_hours || "Ежедневно 08:00–22:00"} />
        <SummaryCard
          label="Maintenance"
          value={settings.maintenance_mode ? "Включен" : "Отключен"}
        />
      </section>

      <form
        className="border-border bg-bg-primary shadow-soft rounded-lg border p-5"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            defaultValue={settings.shop_name}
            label="Название магазина"
            name="shop_name"
            required
          />
          <Input defaultValue={settings.phone ?? undefined} label="Телефон" name="phone" />
          <Input
            defaultValue={settings.email ?? undefined}
            label="Email"
            name="email"
            type="email"
          />
          <Input
            defaultValue={settings.default_city ?? undefined}
            label="Город по умолчанию"
            name="default_city"
          />
          <Input
            defaultValue={settings.currency}
            label="Валюта"
            name="currency"
            required
          />
          <Input
            defaultValue={settings.min_order_amount}
            label="Мин. сумма заказа"
            min="0"
            name="min_order_amount"
            required
            step="0.01"
            type="number"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectBoolean
            defaultValue={settings.delivery_enabled}
            label="Доставка курьером"
            name="delivery_enabled"
          />
          <SelectBoolean
            defaultValue={settings.pickup_enabled}
            label="Самовывоз"
            name="pickup_enabled"
          />
          <SelectBoolean
            defaultValue={settings.online_payment_enabled}
            label="Онлайн-оплата картой"
            name="online_payment_enabled"
          />
          <SelectBoolean
            defaultValue={settings.pay_on_delivery_enabled}
            label="Оплата при получении"
            name="pay_on_delivery_enabled"
          />
          <SelectBoolean
            defaultValue={settings.maintenance_mode}
            label="Режим техобслуживания (сайт на паузе)"
            name="maintenance_mode"
          />
        </div>

        <div className="mt-4">
          <Textarea defaultValue={settings.address ?? undefined} label="Адрес" name="address" />
        </div>

        {/* График работы магазина по дням недели */}
        <div className="mt-6 border-t border-border pt-5">
          <WeeklyScheduleEditor
            initialSchedule={settings.schedule}
            workingHoursSummary={settings.working_hours}
            onChange={(newSchedule, summaryText) => {
              setSchedule(newSchedule);
              setWorkingHours(summaryText);
            }}
          />
          <input type="hidden" name="working_hours" value={workingHours} />
        </div>

        {/* Платёжный шлюз (Онлайн-оплата) */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <CreditCard size={18} className="text-accent-primary" />
                Платёжный шлюз (Приём онлайн-платежей)
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Выберите активный сервис эквайринга и настройте ключи интеграции
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <ShieldCheck size={13} />
              {paymentProvider === "robokassa" ? "Активна Robokassa" : "Активна ЮKassa"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Основной платёжный сервис</span>
                <select
                  className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm font-medium transition outline-none"
                  name="payment_provider"
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                >
                  <option value="yookassa">ЮKassa (YooKassa)</option>
                  <option value="robokassa">Робокасса (Robokassa)</option>
                </select>
              </label>
              <p className="mt-1 text-xs text-text-secondary">
                Переключает шлюз, на который перенаправляется покупатель при онлайн-оплате.
              </p>
            </div>

            {paymentProvider === "robokassa" && (
              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">Тестовый режим Robokassa</span>
                  <select
                    className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm font-medium transition outline-none"
                    name="robokassa_is_test"
                    value={robokassaIsTest ? "true" : "false"}
                    onChange={(e) => setRobokassaIsTest(e.target.value === "true")}
                  >
                    <option value="false">Боевой режим (Реальные списания)</option>
                    <option value="true">Тестовый режим (Без списания средств)</option>
                  </select>
                </label>
                <p className="mt-1 text-xs text-text-secondary">
                  В тестовом режиме Robokassa проверяет оплату тестовыми картами.
                </p>
              </div>
            )}
          </div>

          {/* Поля Robokassa */}
          {paymentProvider === "robokassa" ? (
            <div className="mt-4 rounded-xl border border-border bg-bg-secondary/40 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <span>Параметры подключения Robokassa</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  defaultValue={settings.robokassa_merchant_login ?? undefined}
                  label="Идентификатор магазина (Merchant Login)"
                  name="robokassa_merchant_login"
                  placeholder="shop_login"
                />
                <Input
                  defaultValue={settings.robokassa_password_1 ?? undefined}
                  label="Пароль #1 (Инициализация оплаты)"
                  name="robokassa_password_1"
                  type="password"
                  placeholder="Пароль 1 из ЛК"
                />
                <Input
                  defaultValue={settings.robokassa_password_2 ?? undefined}
                  label="Пароль #2 (ResultURL / Оповещение)"
                  name="robokassa_password_2"
                  type="password"
                  placeholder="Пароль 2 из ЛК"
                />
              </div>

              <div className="rounded-lg bg-bg-primary p-3 border border-border/80 text-xs text-text-secondary space-y-1.5">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Info size={14} className="text-accent-primary" />
                  Реквизиты для личного кабинета Robokassa:
                </div>
                <p>• <b>Result URL:</b> <code className="bg-bg-secondary px-1 py-0.5 rounded text-[11px]">https://ваш-домен.ru/api/payments/webhook</code> (Метод: POST)</p>
                <p>• <b>Success URL:</b> <code className="bg-bg-secondary px-1 py-0.5 rounded text-[11px]">https://ваш-домен.ru/payment/success</code> (Метод: GET/POST)</p>
                <p>• <b>Fail URL:</b> <code className="bg-bg-secondary px-1 py-0.5 rounded text-[11px]">https://ваш-домен.ru/payment/fail</code> (Метод: GET/POST)</p>
              </div>
            </div>
          ) : (
            /* Поля ЮKassa */
            <div className="mt-4 rounded-xl border border-border bg-bg-secondary/40 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <span>Параметры подключения ЮKassa</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  defaultValue={settings.yookassa_shop_id ?? undefined}
                  label="Идентификатор магазина (Shop ID)"
                  name="yookassa_shop_id"
                  placeholder="123456"
                />
                <Input
                  defaultValue={settings.yookassa_secret_key ?? undefined}
                  label="Секретный ключ (Secret Key)"
                  name="yookassa_secret_key"
                  type="password"
                  placeholder="live_..."
                />
              </div>

              <div className="rounded-lg bg-bg-primary p-3 border border-border/80 text-xs text-text-secondary space-y-1.5">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Info size={14} className="text-accent-primary" />
                  Настройка Webhook в личном кабинете ЮKassa:
                </div>
                <p>• <b>URL для уведомлений:</b> <code className="bg-bg-secondary px-1 py-0.5 rounded text-[11px]">https://ваш-домен.ru/api/payments/webhook</code></p>
                <p>• <b>События:</b> payment.succeeded, payment.canceled, refund.succeeded</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-text-primary">Юридические документы (152-ФЗ / Оферта)</h3>
            <a
              href="/admin/legal-documents"
              className="text-xs font-bold text-accent-primary hover:underline inline-flex items-center gap-1"
            >
              Редактировать тексты документов в Word-редакторе →
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              defaultValue={settings.privacy_policy_url ?? "/privacy"}
              label="Политика конфиденциальности (URL)"
              name="privacy_policy_url"
            />
            <Input
              defaultValue={settings.user_agreement_url ?? "/offer"}
              label="Публичная оферта (URL)"
              name="user_agreement_url"
            />
            <Input
              defaultValue={settings.personal_data_consent_url ?? "/personal-data-consent"}
              label="Согласие на обработку ПД (URL)"
              name="personal_data_consent_url"
            />
          </div>
        </div>

        <button
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-5 inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          <Save size={16} />
          Сохранить
        </button>
      </form>
    </div>
  );
};

const SelectBoolean = ({
  defaultValue,
  label,
  name,
}: {
  defaultValue: boolean;
  label: string;
  name: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold">{label}</span>
    <select
      className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
      defaultValue={String(defaultValue)}
      name={name}
    >
      <option value="true">Включено</option>
      <option value="false">Отключено</option>
    </select>
  </label>
);

const Input = ({
  defaultValue,
  label,
  min,
  name,
  placeholder,
  required = false,
  step,
  type = "text",
}: {
  defaultValue?: string | undefined;
  label: string;
  min?: string | undefined;
  name: string;
  placeholder?: string | undefined;
  required?: boolean;
  step?: string | undefined;
  type?: string;
}) => {
  const isPhone = name === "phone" || type === "tel";
  const [val, setVal] = useState(() => (defaultValue && isPhone ? formatPhoneMask(defaultValue) : defaultValue ?? ""));

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        name={name}
        required={required}
        min={min}
        step={step}
        type={isPhone ? "tel" : type}
        placeholder={isPhone ? "+7 (___) ___-__-__" : placeholder}
        maxLength={isPhone ? 18 : undefined}
        autoComplete={isPhone ? "tel" : undefined}
        value={val}
        onChange={(e) => {
          if (isPhone) {
            setVal(handlePhoneInputChange(e.target.value, val));
          } else {
            setVal(e.target.value);
          }
        }}
        onFocus={() => {
          if (isPhone && !val) {
            setVal("+7 (");
          }
        }}
        onBlur={() => {
          if (isPhone && (val === "+7 (" || val === "+7")) {
            setVal("");
          }
        }}
      />
    </label>
  );
};

const Textarea = ({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: string | undefined;
  label: string;
  name: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold">{label}</span>
    <textarea
      className="border-border focus:border-accent-primary bg-bg-primary min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-sm transition outline-none"
      defaultValue={defaultValue}
      name={name}
    />
  </label>
);

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <p className="text-text-secondary text-sm">{label}</p>
    <p className="text-text-primary mt-2 text-xl font-bold break-words">{value}</p>
  </article>
);

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => (
  <div
    className={
      tone === "success"
        ? "border-border bg-bg-primary text-success rounded-lg border p-4 text-sm font-bold"
        : "border-border bg-bg-primary text-error rounded-lg border p-4 text-sm font-bold"
    }
  >
    {children}
  </div>
);

const getRequiredFormValue = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

const getNullableFormValue = (formData: FormData, name: string): string | null => {
  const value = getRequiredFormValue(formData, name);
  return value ? value : null;
};

const getBooleanFormValue = (formData: FormData, name: string): boolean => {
  return formData.get(name) === "true";
};

const getSettingsPayload = (
  formData: FormData,
  currentSettings: AdminSettingsResponse,
  schedule: DayScheduleItem[] | null,
): AdminSettingsPayload => {
  const nextSettings = {
    address: getNullableFormValue(formData, "address"),
    currency: getRequiredFormValue(formData, "currency"),
    default_city: getNullableFormValue(formData, "default_city"),
    delivery_enabled: getBooleanFormValue(formData, "delivery_enabled"),
    email: getNullableFormValue(formData, "email"),
    maintenance_mode: getBooleanFormValue(formData, "maintenance_mode"),
    min_order_amount: getRequiredFormValue(formData, "min_order_amount"),
    online_payment_enabled: getBooleanFormValue(formData, "online_payment_enabled"),
    pay_on_delivery_enabled: getBooleanFormValue(formData, "pay_on_delivery_enabled"),
    phone: formData.get("phone") ? normalizePhoneNumber(getRequiredFormValue(formData, "phone")) || null : null,
    pickup_enabled: getBooleanFormValue(formData, "pickup_enabled"),
    shop_name: getRequiredFormValue(formData, "shop_name"),
    working_hours: getNullableFormValue(formData, "working_hours"),
    payment_provider: getRequiredFormValue(formData, "payment_provider"),
    robokassa_merchant_login: getNullableFormValue(formData, "robokassa_merchant_login"),
    robokassa_password_1: getNullableFormValue(formData, "robokassa_password_1"),
    robokassa_password_2: getNullableFormValue(formData, "robokassa_password_2"),
    robokassa_is_test: getBooleanFormValue(formData, "robokassa_is_test"),
    yookassa_shop_id: getNullableFormValue(formData, "yookassa_shop_id"),
    yookassa_secret_key: getNullableFormValue(formData, "yookassa_secret_key"),
  };
  const payload: AdminSettingsPayload = {};

  addChangedField(payload, "address", nextSettings.address, currentSettings.address ?? null);
  addChangedField(payload, "currency", nextSettings.currency, currentSettings.currency);
  addChangedField(
    payload,
    "default_city",
    nextSettings.default_city,
    currentSettings.default_city ?? null,
  );
  addChangedField(
    payload,
    "delivery_enabled",
    nextSettings.delivery_enabled,
    currentSettings.delivery_enabled,
  );
  addChangedField(payload, "email", nextSettings.email, currentSettings.email ?? null);
  addChangedField(
    payload,
    "maintenance_mode",
    nextSettings.maintenance_mode,
    currentSettings.maintenance_mode,
  );
  addChangedField(
    payload,
    "min_order_amount",
    nextSettings.min_order_amount,
    currentSettings.min_order_amount,
  );
  addChangedField(
    payload,
    "online_payment_enabled",
    nextSettings.online_payment_enabled,
    currentSettings.online_payment_enabled,
  );
  addChangedField(
    payload,
    "pay_on_delivery_enabled",
    nextSettings.pay_on_delivery_enabled,
    currentSettings.pay_on_delivery_enabled,
  );
  addChangedField(payload, "phone", nextSettings.phone, currentSettings.phone ?? null);
  addChangedField(
    payload,
    "pickup_enabled",
    nextSettings.pickup_enabled,
    currentSettings.pickup_enabled,
  );
  addChangedField(payload, "shop_name", nextSettings.shop_name, currentSettings.shop_name);
  addChangedField(
    payload,
    "working_hours",
    nextSettings.working_hours,
    currentSettings.working_hours ?? null,
  );
  addChangedField(payload, "payment_provider", nextSettings.payment_provider, currentSettings.payment_provider ?? "yookassa");
  addChangedField(payload, "robokassa_merchant_login", nextSettings.robokassa_merchant_login, currentSettings.robokassa_merchant_login ?? null);
  addChangedField(payload, "robokassa_password_1", nextSettings.robokassa_password_1, currentSettings.robokassa_password_1 ?? null);
  addChangedField(payload, "robokassa_password_2", nextSettings.robokassa_password_2, currentSettings.robokassa_password_2 ?? null);
  addChangedField(payload, "robokassa_is_test", nextSettings.robokassa_is_test, Boolean(currentSettings.robokassa_is_test));
  addChangedField(payload, "yookassa_shop_id", nextSettings.yookassa_shop_id, currentSettings.yookassa_shop_id ?? null);
  addChangedField(payload, "yookassa_secret_key", nextSettings.yookassa_secret_key, currentSettings.yookassa_secret_key ?? null);

  if (schedule && JSON.stringify(schedule) !== JSON.stringify(currentSettings.schedule ?? null)) {
    payload.schedule = schedule;
  }

  return payload;
};

const addChangedField = (
  payload: AdminSettingsPayload,
  field: string,
  nextValue: boolean | string | null,
  currentValue: boolean | string | null,
): void => {
  if (nextValue !== currentValue) {
    payload[field] = nextValue;
  }
};

const getSettingsErrorMessage = (error: unknown): string => {
  if (error instanceof AdminApiError && error.detail) {
    return localizeErrorMessage(error.detail);
  }

  return "Не удалось сохранить настройки. Проверьте данные или войдите заново.";
};
