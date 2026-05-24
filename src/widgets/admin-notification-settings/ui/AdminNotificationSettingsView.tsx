"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Mail, MessageCircle, Save, Send } from "lucide-react";
import {
  adminNotificationApi,
  type AdminNotificationSettingsResponse,
} from "@/entities/admin-notification";

interface AdminNotificationSettingsViewProps {
  settings: AdminNotificationSettingsResponse;
}

export const AdminNotificationSettingsView = ({
  settings: initialSettings,
}: AdminNotificationSettingsViewProps) => {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const handleSettingsSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setMessage(null);
    setError(null);

    void adminNotificationApi
      .updateSettings({
        email_enabled: getBooleanFormValue(formData, "email_enabled"),
        email_from: getNullableFormValue(formData, "email_from"),
        email_sender_name: getRequiredFormValue(formData, "email_sender_name"),
        notify_admin_1c_error: getBooleanFormValue(formData, "notify_admin_1c_error"),
        notify_admin_new_order: getBooleanFormValue(formData, "notify_admin_new_order"),
        notify_admin_payment_error: getBooleanFormValue(formData, "notify_admin_payment_error"),
        notify_customer_delivery: getBooleanFormValue(formData, "notify_customer_delivery"),
        notify_customer_order_created: getBooleanFormValue(
          formData,
          "notify_customer_order_created",
        ),
        notify_customer_order_status: getBooleanFormValue(formData, "notify_customer_order_status"),
        notify_customer_payment: getBooleanFormValue(formData, "notify_customer_payment"),
        telegram_admin_chat_id: getNullableFormValue(formData, "telegram_admin_chat_id"),
        telegram_enabled: getBooleanFormValue(formData, "telegram_enabled"),
      })
      .then((response) => {
        setSettings(response);
        setMessage("Настройки уведомлений сохранены.");
      })
      .catch(() => {
        setError("Не удалось сохранить настройки. Проверьте данные или войдите заново.");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleTestEmailSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSendingEmail(true);
    setMessage(null);
    setError(null);

    void adminNotificationApi
      .sendTestEmail({
        email: getRequiredFormValue(formData, "email"),
        message: getNullableFormValue(formData, "message"),
        subject: getNullableFormValue(formData, "subject"),
      })
      .then((response) => {
        setMessage(response.message);
      })
      .catch(() => {
        setError("Не удалось отправить тестовый email. Проверьте адрес и настройки SMTP.");
      })
      .finally(() => {
        setIsSendingEmail(false);
      });
  };

  const handleTestTelegramSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSendingTelegram(true);
    setMessage(null);
    setError(null);

    void adminNotificationApi
      .sendTestTelegram({
        chat_id: getNullableFormValue(formData, "chat_id"),
        message: getNullableFormValue(formData, "message"),
      })
      .then((response) => {
        setMessage(response.message);
      })
      .catch(() => {
        setError("Не удалось отправить тест в Telegram. Проверьте chat id и настройки бота.");
      })
      .finally(() => {
        setIsSendingTelegram(false);
      });
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Настройки уведомлений</h1>
        <p className="text-text-secondary mt-2">
          Каналы отправки, события для администраторов и клиентские уведомления.
        </p>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Email" value={settings.email_enabled ? "Включен" : "Отключен"} />
        <SummaryCard label="Отправитель" value={settings.email_from ?? "Не указан"} />
        <SummaryCard label="Telegram" value={settings.telegram_enabled ? "Включен" : "Отключен"} />
        <SummaryCard label="Chat ID" value={settings.telegram_admin_chat_id ?? "Не указан"} />
      </section>

      <form
        className="border-border bg-bg-primary shadow-soft rounded-lg border p-5"
        onSubmit={handleSettingsSubmit}
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="bg-bg-secondary text-accent-primary grid size-10 place-items-center rounded-lg">
            <Mail size={18} />
          </span>
          <div>
            <h2 className="text-text-primary text-lg font-bold">Каналы</h2>
            <p className="text-text-secondary text-sm">Email и Telegram для системных событий.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectBoolean
            defaultValue={settings.email_enabled}
            label="Email-уведомления"
            name="email_enabled"
          />
          <Input
            defaultValue={settings.email_from ?? undefined}
            label="Email отправителя"
            name="email_from"
            type="email"
          />
          <Input
            defaultValue={settings.email_sender_name}
            label="Имя отправителя"
            name="email_sender_name"
            required
          />
          <SelectBoolean
            defaultValue={settings.telegram_enabled}
            label="Telegram"
            name="telegram_enabled"
          />
          <Input
            defaultValue={settings.telegram_admin_chat_id ?? undefined}
            label="Telegram chat id"
            name="telegram_admin_chat_id"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <SettingsGroup title="Администратор">
            <SelectBoolean
              defaultValue={settings.notify_admin_new_order}
              label="Новые заказы"
              name="notify_admin_new_order"
            />
            <SelectBoolean
              defaultValue={settings.notify_admin_payment_error}
              label="Ошибки оплаты"
              name="notify_admin_payment_error"
            />
            <SelectBoolean
              defaultValue={settings.notify_admin_1c_error}
              label="Ошибки 1С"
              name="notify_admin_1c_error"
            />
          </SettingsGroup>

          <SettingsGroup title="Клиент">
            <SelectBoolean
              defaultValue={settings.notify_customer_order_created}
              label="Создание заказа"
              name="notify_customer_order_created"
            />
            <SelectBoolean
              defaultValue={settings.notify_customer_order_status}
              label="Статус заказа"
              name="notify_customer_order_status"
            />
            <SelectBoolean
              defaultValue={settings.notify_customer_payment}
              label="Оплата"
              name="notify_customer_payment"
            />
            <SelectBoolean
              defaultValue={settings.notify_customer_delivery}
              label="Доставка"
              name="notify_customer_delivery"
            />
          </SettingsGroup>
        </div>

        <button
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-5 inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          <Save size={16} />
          Сохранить
        </button>
      </form>

      <section className="grid gap-4 xl:grid-cols-2">
        <TestCard icon={<Mail size={18} />} title="Тест email">
          <form className="space-y-4" onSubmit={handleTestEmailSubmit}>
            <Input
              defaultValue={settings.email_from ?? undefined}
              label="Получатель"
              name="email"
              required
              type="email"
            />
            <Input label="Тема" name="subject" />
            <Textarea label="Сообщение" name="message" />
            <button
              className="border-border hover:bg-bg-hover inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
              disabled={isSendingEmail}
              type="submit"
            >
              <Send size={16} />
              Отправить email
            </button>
          </form>
        </TestCard>

        <TestCard icon={<MessageCircle size={18} />} title="Тест Telegram">
          <form className="space-y-4" onSubmit={handleTestTelegramSubmit}>
            <Input
              defaultValue={settings.telegram_admin_chat_id ?? undefined}
              label="Chat ID"
              name="chat_id"
            />
            <Textarea label="Сообщение" name="message" />
            <button
              className="border-border hover:bg-bg-hover inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
              disabled={isSendingTelegram}
              type="submit"
            >
              <Send size={16} />
              Отправить Telegram
            </button>
          </form>
        </TestCard>
      </section>
    </div>
  );
};

const SettingsGroup = ({ children, title }: { children: ReactNode; title: string }) => (
  <section className="border-border bg-bg-secondary rounded-lg border p-4">
    <h3 className="text-text-primary font-bold">{title}</h3>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

const TestCard = ({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) => (
  <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <div className="mb-5 flex items-center gap-3">
      <span className="bg-bg-secondary text-accent-primary grid size-10 place-items-center rounded-lg">
        {icon}
      </span>
      <h2 className="text-text-primary text-lg font-bold">{title}</h2>
    </div>
    {children}
  </article>
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
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string | undefined;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold">{label}</span>
    <input
      className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
      defaultValue={defaultValue}
      name={name}
      required={required}
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
