"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Save } from "lucide-react";

import {
  adminSettingsApi,
  type AdminSettingsPayload,
  type AdminSettingsResponse,
} from "@/entities/admin-settings";
import { AdminApiError } from "@/shared/api";

interface AdminSettingsViewProps {
  settings: AdminSettingsResponse;
}

export const AdminSettingsView = ({ settings: initialSettings }: AdminSettingsViewProps) => {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setMessage(null);
    setError(null);

    const payload = getSettingsPayload(formData, settings);

    if (Object.keys(payload).length === 0) {
      setIsPending(false);
      setMessage("Нет изменений для сохранения.");
      return;
    }

    void adminSettingsApi
      .update(payload)
      .then((response) => {
        setSettings(response);
        setMessage("Общие настройки сохранены.");
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
          Данные магазина, способы получения и оплаты, минимальная сумма заказа.
        </p>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Магазин" value={settings.shop_name} />
        <SummaryCard label="Город" value={settings.default_city ?? "Не указан"} />
        <SummaryCard label="Валюта" value={settings.currency} />
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
          <Input defaultValue={settings.currency} label="Валюта" name="currency" required />
          <Input
            defaultValue={settings.min_order_amount}
            label="Минимальная сумма заказа"
            min="0"
            name="min_order_amount"
            required
            step="0.01"
            type="number"
          />
          <SelectBoolean
            defaultValue={settings.delivery_enabled}
            label="Доставка"
            name="delivery_enabled"
          />
          <SelectBoolean
            defaultValue={settings.pickup_enabled}
            label="Самовывоз"
            name="pickup_enabled"
          />
          <SelectBoolean
            defaultValue={settings.online_payment_enabled}
            label="Онлайн-оплата"
            name="online_payment_enabled"
          />
          <SelectBoolean
            defaultValue={settings.pay_on_delivery_enabled}
            label="Оплата при получении"
            name="pay_on_delivery_enabled"
          />
          <SelectBoolean
            defaultValue={settings.maintenance_mode}
            label="Maintenance mode"
            name="maintenance_mode"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Textarea defaultValue={settings.address ?? undefined} label="Адрес" name="address" />
          <Textarea
            defaultValue={settings.working_hours ?? undefined}
            label="Режим работы"
            name="working_hours"
          />
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
  required = false,
  step,
  type = "text",
}: {
  defaultValue?: string | undefined;
  label: string;
  min?: string | undefined;
  name: string;
  required?: boolean;
  step?: string | undefined;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold">{label}</span>
    <input
      className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
      defaultValue={defaultValue}
      min={min}
      name={name}
      required={required}
      step={step}
      type={type}
    />
  </label>
);

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
    phone: getNullableFormValue(formData, "phone"),
    pickup_enabled: getBooleanFormValue(formData, "pickup_enabled"),
    shop_name: getRequiredFormValue(formData, "shop_name"),
    working_hours: getNullableFormValue(formData, "working_hours"),
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
    return error.detail;
  }

  return "Не удалось сохранить настройки. Проверьте данные или войдите заново.";
};
