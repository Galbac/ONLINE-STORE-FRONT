"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { notificationApi } from "@/entities/notification";
import { ROUTES } from "@/shared/config";
import { Button, Container, getStoredAccessToken } from "@/shared/ui";

type PendingChannel = "email" | "telegram";

export const ProfileNotificationTestView = () => {
  const [pendingChannel, setPendingChannel] = useState<PendingChannel | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAction = async (
    channel: PendingChannel,
    handler: () => Promise<string>,
  ): Promise<void> => {
    setPendingChannel(channel);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const message = await handler();
      setStatusMessage(message);
    } catch {
      setErrorMessage("Не удалось отправить тестовое уведомление.");
    } finally {
      setPendingChannel(null);
    }
  };

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const accessToken = getStoredAccessToken();

    void runAction("email", async () => {
      const response = await notificationApi.sendTestEmail(
        {
          email: getRequiredFormValue(formData, "email"),
          message: getNullableFormValue(formData, "message"),
          subject: getNullableFormValue(formData, "subject"),
        },
        accessToken,
      );

      return response.email ? `${response.message}: ${response.email}` : response.message;
    });
  };

  const handleTelegramSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const accessToken = getStoredAccessToken();

    void runAction("telegram", async () => {
      const response = await notificationApi.sendTestTelegram(
        {
          chat_id: getNullableFormValue(formData, "chat_id"),
          message: getNullableFormValue(formData, "message"),
        },
        accessToken,
      );

      return response.chat_id ? `${response.message}: ${response.chat_id}` : response.message;
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE_NOTIFICATIONS}>
            Уведомления
          </Link>
          <span>/</span>
          <span>Тест</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-text-primary text-3xl font-bold sm:text-4xl">Тест уведомлений</h1>
          <p className="text-text-secondary mt-3 max-w-2xl">
            Страница доступна только в development или для admin-сессии.
          </p>
        </header>

        {statusMessage ? <Alert tone="success">{statusMessage}</Alert> : null}
        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <TestCard
            icon={<Mail size={22} />}
            title="Email"
            onSubmit={handleEmailSubmit}
            submitText="Отправить email"
            pending={pendingChannel === "email"}
          >
            <Input label="Email" name="email" required type="email" />
            <Input label="Тема" name="subject" />
            <Textarea label="Сообщение" name="message" />
          </TestCard>

          <TestCard
            icon={<Send size={22} />}
            title="Telegram"
            onSubmit={handleTelegramSubmit}
            submitText="Отправить Telegram"
            pending={pendingChannel === "telegram"}
          >
            <Input label="Chat ID" name="chat_id" />
            <Textarea label="Сообщение" name="message" />
          </TestCard>
        </section>
      </Container>
    </main>
  );
};

const TestCard = ({
  children,
  icon,
  onSubmit,
  pending,
  submitText,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  submitText: string;
  title: string;
}) => {
  return (
    <section className="border-border bg-bg-secondary rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <span className="bg-bg-primary text-accent-primary border-border grid size-11 place-items-center rounded-lg border">
          {icon}
        </span>
        <h2 className="text-text-primary text-xl font-bold">{title}</h2>
      </div>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        {children}
        <Button className="h-11 w-full" disabled={pending} type="submit">
          {submitText}
        </Button>
      </form>
    </section>
  );
};

const Input = ({
  label,
  name,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
};

const Textarea = ({ label, name }: { label: string; name: string }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <textarea
        className="border-border focus:border-accent-primary bg-bg-primary min-h-32 w-full resize-y rounded-lg border px-3 py-3 text-sm transition outline-none"
        maxLength={1000}
        name={name}
      />
    </label>
  );
};

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => {
  return (
    <div
      className={
        tone === "success"
          ? "border-border bg-bg-secondary text-success mb-5 rounded-lg border p-4 text-sm font-bold"
          : "border-border bg-bg-secondary text-error mb-5 rounded-lg border p-4 text-sm font-bold"
      }
    >
      {children}
    </div>
  );
};

const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const getNullableFormValue = (formData: FormData, key: string): string | null => {
  const value = getRequiredFormValue(formData, key);

  return value || null;
};
