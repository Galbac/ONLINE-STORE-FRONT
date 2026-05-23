"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { adminDeliveryApi, type AdminDeliverySettingsResponse } from "@/entities/admin-delivery";
import { ROUTES } from "@/shared/config";

interface AdminDeliverySettingsViewProps {
  settings: AdminDeliverySettingsResponse;
}

export const AdminDeliverySettingsView = ({
  settings: initialSettings,
}: AdminDeliverySettingsViewProps) => {
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

    void adminDeliveryApi
      .updateSettings({
        base_delivery_price: getRequiredFormValue(formData, "base_delivery_price"),
        default_city: getNullableFormValue(formData, "default_city"),
        delivery_comment: getNullableFormValue(formData, "delivery_comment"),
        delivery_enabled: formData.get("delivery_enabled") === "true",
        free_delivery_from: getNullableFormValue(formData, "free_delivery_from"),
        min_order_amount: getRequiredFormValue(formData, "min_order_amount"),
        pickup_comment: getNullableFormValue(formData, "pickup_comment"),
        pickup_enabled: formData.get("pickup_enabled") === "true",
        time_slots_enabled: formData.get("time_slots_enabled") === "true",
      })
      .then((response) => {
        setSettings(response);
        setMessage("Настройки доставки сохранены.");
      })
      .catch(() => {
        setError("Не удалось сохранить настройки. Проверьте данные или войдите заново.");
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <div className="space-y-6">
      <DeliveryTabs />
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Настройки доставки</h1>
        <p className="text-text-secondary mt-2">
          Основные правила доставки, самовывоза, цен и клиентских комментариев.
        </p>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Доставка"
          value={settings.delivery_enabled ? "Включена" : "Отключена"}
        />
        <SummaryCard label="Самовывоз" value={settings.pickup_enabled ? "Включен" : "Отключен"} />
        <SummaryCard label="Валюта" value={settings.currency} />
      </section>

      <form
        className="border-border bg-bg-primary shadow-soft rounded-lg border p-5"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            defaultValue={settings.time_slots_enabled}
            label="Временные слоты"
            name="time_slots_enabled"
          />
          <Input
            defaultValue={settings.min_order_amount}
            label="Минимальная сумма заказа"
            min="0"
            name="min_order_amount"
            required
            step="0.01"
            type="number"
          />
          <Input
            defaultValue={settings.base_delivery_price}
            label="Базовая цена доставки"
            min="0"
            name="base_delivery_price"
            required
            step="0.01"
            type="number"
          />
          <Input
            defaultValue={settings.free_delivery_from ?? undefined}
            label="Бесплатная доставка от"
            min="0"
            name="free_delivery_from"
            step="0.01"
            type="number"
          />
          <Input
            defaultValue={settings.default_city ?? undefined}
            label="Город по умолчанию"
            name="default_city"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Textarea
            defaultValue={settings.delivery_comment ?? undefined}
            label="Комментарий доставки"
            name="delivery_comment"
          />
          <Textarea
            defaultValue={settings.pickup_comment ?? undefined}
            label="Комментарий самовывоза"
            name="pickup_comment"
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

export const DeliveryTabs = () => {
  return (
    <nav className="flex flex-wrap gap-2">
      <TabLink href={ROUTES.ADMIN_DELIVERY_SETTINGS}>Настройки</TabLink>
      <TabLink href={ROUTES.ADMIN_DELIVERY_ZONES}>Зоны</TabLink>
      <TabLink href={ROUTES.ADMIN_DELIVERY_PICKUP_POINTS}>Самовывоз</TabLink>
    </nav>
  );
};

const TabLink = ({ children, href }: { children: ReactNode; href: string }) => (
  <Link
    className="border-border hover:bg-bg-hover rounded-lg border px-4 py-2 text-sm font-bold transition"
    href={href}
  >
    {children}
  </Link>
);

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
    <p className="text-text-primary mt-2 text-2xl font-bold">{value}</p>
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

const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getNullableFormValue = (formData: FormData, key: string): string | null => {
  const value = getRequiredFormValue(formData, key);
  return value || null;
};
