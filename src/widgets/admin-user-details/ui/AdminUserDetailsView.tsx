"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Save, Unlock } from "lucide-react";
import {
  adminUserApi,
  type AdminUserAddressResponse,
  type AdminUserDetailResponse,
  type AdminUserOrderShortResponse,
  type AdminUserOrdersResponse,
} from "@/entities/admin-user";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface AdminUserDetailsViewProps {
  initialOrders: AdminUserOrdersResponse;
  initialUser: AdminUserDetailResponse;
}

type PendingAction = "block" | "unblock" | "update";

export const AdminUserDetailsView = ({ initialOrders, initialUser }: AdminUserDetailsViewProps) => {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [orders] = useState(initialOrders);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const runAction = async (action: PendingAction, handler: () => Promise<void>): Promise<void> => {
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      await handler();
      router.refresh();
    } catch {
      setError("Операция не выполнена. Проверьте данные или войдите заново.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void runAction("update", async () => {
      const response = await adminUserApi.update(user.id, {
        email: getNullableFormValue(formData, "email"),
        is_active: formData.get("is_active") === "true",
        name: getRequiredFormValue(formData, "name"),
        phone: getRequiredFormValue(formData, "phone"),
      });

      setUser((currentUser) => ({
        ...currentUser,
        email: response.email,
        is_active: response.is_active,
        name: response.name,
        phone: response.phone,
      }));
      setMessage("Данные пользователя сохранены.");
    });
  };

  const handleBlock = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void runAction("block", async () => {
      const response = await adminUserApi.block(user.id, {
        reason: getNullableFormValue(formData, "reason"),
      });

      setUser((currentUser) => ({
        ...currentUser,
        is_blocked: response.is_blocked,
      }));
      setMessage(response.message);
    });
  };

  const handleUnblock = (): void => {
    void runAction("unblock", async () => {
      const response = await adminUserApi.unblock(user.id);

      setUser((currentUser) => ({
        ...currentUser,
        is_blocked: response.is_blocked,
      }));
      setMessage(response.message);
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
            href={ROUTES.ADMIN_USERS}
          >
            <ArrowLeft size={16} />
            Пользователи
          </Link>
          <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">{user.name}</h1>
          <p className="text-text-secondary mt-2">
            ID {user.id} · зарегистрирован {formatDate(user.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill active={user.is_active} falseLabel="Неактивен" trueLabel="Активен" />
          <StatusPill
            active={!user.is_blocked}
            falseLabel="Заблокирован"
            trueLabel="Не заблокирован"
          />
          {user.is_deleted ? <span className="text-error text-sm font-bold">Удален</span> : null}
        </div>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Заказов" value={user.orders_count.toLocaleString("ru-RU")} />
        <SummaryCard label="Сумма заказов" value={toPriceFormat(user.total_spent)} />
        <SummaryCard label="Адресов" value={user.addresses.length.toLocaleString("ru-RU")} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Данные пользователя">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Имя" value={user.name} />
              <DetailRow label="Телефон" value={user.phone} />
              <DetailRow label="Email" value={user.email ?? "-"} />
              <DetailRow label="Активность" value={user.is_active ? "Активен" : "Неактивен"} />
              <DetailRow
                label="Блокировка"
                value={user.is_blocked ? "Заблокирован" : "Не заблокирован"}
              />
              <DetailRow label="Удаление" value={user.is_deleted ? "Удален" : "Нет"} />
            </div>
          </Card>

          <Card title="Адреса">
            {user.addresses.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {user.addresses.map((address) => (
                  <AddressCard address={address} key={address.id} />
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Адреса не добавлены.</p>
            )}
          </Card>

          <Card title="История заказов">
            <OrdersTable orders={orders.items} />
            <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-text-secondary text-sm">
                {orders.total > 0
                  ? `${(orders.page - 1) * orders.limit + 1}-${Math.min(
                      orders.page * orders.limit,
                      orders.total,
                    )} из ${orders.total}`
                  : "0 из 0"}
              </p>
              <span className="text-text-muted text-sm">
                Страница {orders.page} из {orders.pages || 1}
              </span>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Редактирование">
            <form className="space-y-3" onSubmit={handleUpdate}>
              <Input defaultValue={user.name} label="Имя" name="name" required />
              <Input defaultValue={user.phone} label="Телефон" name="phone" required />
              <Input defaultValue={user.email ?? ""} label="Email" name="email" />
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Активность</span>
                <select
                  className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                  defaultValue={String(user.is_active)}
                  name="is_active"
                >
                  <option value="true">Активен</option>
                  <option value="false">Неактивен</option>
                </select>
              </label>
              <SubmitButton disabled={pendingAction === "update"} icon={<Save size={16} />}>
                Сохранить
              </SubmitButton>
            </form>
          </Card>

          <Card title="Блокировка">
            {user.is_blocked ? (
              <button
                className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={pendingAction === "unblock"}
                onClick={handleUnblock}
                type="button"
              >
                <Unlock size={16} />
                Разблокировать
              </button>
            ) : (
              <form className="space-y-3" onSubmit={handleBlock}>
                <Textarea label="Причина блокировки" name="reason" />
                <SubmitButton
                  disabled={pendingAction === "block"}
                  icon={<Lock size={16} />}
                  tone="danger"
                >
                  Заблокировать
                </SubmitButton>
              </form>
            )}
          </Card>

          <Card title="Последние заказы">
            {user.recent_orders.length > 0 ? (
              <div className="space-y-3">
                {user.recent_orders.map((order) => (
                  <RecentOrderCard order={order} key={order.id} />
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Последних заказов нет.</p>
            )}
          </Card>
        </aside>
      </section>
    </div>
  );
};

const Card = ({ children, title }: { children: ReactNode; title: string }) => {
  return (
    <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <h2 className="text-text-primary text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-text-primary mt-2 text-2xl font-bold break-words">{value}</p>
    </article>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary text-right font-bold">{value}</span>
    </div>
  );
};

const AddressCard = ({ address }: { address: AdminUserAddressResponse }) => {
  return (
    <article className="border-border rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-text-primary font-bold">{address.title ?? `Адрес ${address.id}`}</p>
        {address.is_default ? (
          <span className="bg-bg-secondary border-border rounded-lg border px-2 py-1 text-xs font-bold">
            По умолчанию
          </span>
        ) : null}
      </div>
      <p className="text-text-secondary mt-3 text-sm">{formatAddress(address)}</p>
      {address.comment ? <p className="text-text-muted mt-2 text-xs">{address.comment}</p> : null}
    </article>
  );
};

const OrdersTable = ({ orders }: { orders: AdminUserOrderShortResponse[] }) => {
  if (orders.length === 0) {
    return <p className="text-text-secondary">Заказы не найдены.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
          <tr>
            <TableHeader>Заказ</TableHeader>
            <TableHeader>Статус</TableHeader>
            <TableHeader>Оплата</TableHeader>
            <TableHeader>Получение</TableHeader>
            <TableHeader>Сумма</TableHeader>
            <TableHeader>Дата</TableHeader>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr className="border-border border-t align-top" key={order.id}>
              <TableCell>
                <Link
                  className="hover:text-accent-primary font-bold transition"
                  href={ROUTES.ADMIN_ORDER(order.id)}
                >
                  {order.order_number}
                </Link>
                <p className="text-text-muted mt-1 text-xs">{order.items_count ?? 0} поз.</p>
              </TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>{order.payment_status ?? "-"}</TableCell>
              <TableCell>{order.delivery_type ?? "-"}</TableCell>
              <TableCell>{toPriceFormat(order.final_price)}</TableCell>
              <TableCell>{formatDate(order.created_at)}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RecentOrderCard = ({ order }: { order: AdminUserOrderShortResponse }) => {
  return (
    <Link
      className="border-border hover:bg-bg-hover block rounded-lg border p-3 transition"
      href={ROUTES.ADMIN_ORDER(order.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-primary font-bold">{order.order_number}</p>
        <span className="text-text-primary text-sm font-bold">
          {toPriceFormat(order.final_price)}
        </span>
      </div>
      <p className="text-text-muted mt-2 text-xs">
        {order.status} · {formatDate(order.created_at)}
      </p>
    </Link>
  );
};

const Input = ({
  defaultValue,
  label,
  name,
  required = false,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="border-border focus:border-accent-primary placeholder:text-text-muted h-11 w-full rounded-lg border bg-transparent px-3 text-sm transition outline-none"
        defaultValue={defaultValue}
        name={name}
        required={required}
        type="text"
      />
    </label>
  );
};

const Textarea = ({ label, name }: { label: string; name: string }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <textarea
        className="border-border focus:border-accent-primary placeholder:text-text-muted min-h-24 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm transition outline-none"
        name={name}
      />
    </label>
  );
};

const SubmitButton = ({
  children,
  disabled,
  icon,
  tone = "primary",
}: {
  children: ReactNode;
  disabled: boolean;
  icon: ReactNode;
  tone?: "danger" | "primary";
}) => {
  const className =
    tone === "danger"
      ? "bg-error text-white hover:opacity-90"
      : "bg-accent-primary text-accent-contrast hover:bg-accent-hover";

  return (
    <button
      className={`${className} inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60`}
      disabled={disabled}
      type="submit"
    >
      {icon}
      {children}
    </button>
  );
};

const StatusPill = ({
  active,
  falseLabel,
  trueLabel,
}: {
  active: boolean;
  falseLabel: string;
  trueLabel: string;
}) => {
  return (
    <span
      className={
        active
          ? "text-success inline-flex rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold"
          : "text-error inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold"
      }
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
};

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => {
  return (
    <div
      className={
        tone === "error"
          ? "border-error text-error rounded-lg border bg-red-50 p-4 text-sm font-bold"
          : "text-success rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold"
      }
    >
      {children}
    </div>
  );
};

const TableHeader = ({ children }: { children: ReactNode }) => {
  return <th className="px-4 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: ReactNode }) => {
  return <td className="px-4 py-4 text-sm">{children}</td>;
};

const getNullableFormValue = (formData: FormData, name: string): string | null => {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
};

const getRequiredFormValue = (formData: FormData, name: string): string => {
  return getNullableFormValue(formData, name) ?? "";
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatAddress = (address: AdminUserAddressResponse): string => {
  return [
    address.city,
    address.street,
    address.house,
    address.building ? `к. ${address.building}` : null,
    address.apartment ? `кв. ${address.apartment}` : null,
    address.entrance ? `подъезд ${address.entrance}` : null,
    address.floor ? `этаж ${address.floor}` : null,
  ]
    .filter(Boolean)
    .join(", ");
};
