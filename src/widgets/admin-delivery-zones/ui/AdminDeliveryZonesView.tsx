"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Edit2, Save, Trash2, X } from "lucide-react";
import {
  adminDeliveryApi,
  type AdminDeliveryZoneListResponse,
  type AdminDeliveryZoneResponse,
} from "@/entities/admin-delivery";
import { ROUTES } from "@/shared/config";
import { DeliveryTabs } from "@/widgets/admin-delivery-settings";

export interface AdminDeliveryFilters {
  city: string;
  is_active: string;
  page: string;
  q: string;
}

interface AdminDeliveryZonesViewProps {
  filters: AdminDeliveryFilters;
  zones: AdminDeliveryZoneListResponse;
}

export const AdminDeliveryZonesView = ({
  filters,
  zones: initialZones,
}: AdminDeliveryZonesViewProps) => {
  const [zones, setZones] = useState(initialZones.items);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | "create" | null>(null);

  const handleCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPendingId("create");
    setMessage(null);
    setError(null);

    void adminDeliveryApi
      .createZone(getZonePayload(formData))
      .then((zone) => {
        setZones((current) => [zone, ...current]);
        event.currentTarget.reset();
        setMessage("Зона доставки создана.");
      })
      .catch(() => setError("Не удалось создать зону."))
      .finally(() => setPendingId(null));
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, zoneId: number): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPendingId(zoneId);
    setMessage(null);
    setError(null);

    void adminDeliveryApi
      .updateZone(zoneId, getZonePayload(formData))
      .then((zone) => {
        setZones((current) => current.map((item) => (item.id === zone.id ? zone : item)));
        setEditingZoneId(null);
        setMessage("Зона доставки сохранена.");
      })
      .catch(() => setError("Не удалось сохранить зону."))
      .finally(() => setPendingId(null));
  };

  const handleDelete = (zoneId: number): void => {
    if (!window.confirm("Удалить зону доставки?")) return;
    setPendingId(zoneId);
    setMessage(null);
    setError(null);

    void adminDeliveryApi
      .deleteZone(zoneId)
      .then((response) => {
        setZones((current) => current.filter((zone) => zone.id !== zoneId));
        setMessage(response.message);
      })
      .catch(() => setError("Не удалось удалить зону."))
      .finally(() => setPendingId(null));
  };

  return (
    <div className="space-y-6">
      <DeliveryTabs />
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Зоны доставки</h1>
        <p className="text-text-secondary mt-2">
          Города, зоны, стоимости, минимальные суммы и активность.
        </p>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Filters filters={filters} route={ROUTES.ADMIN_DELIVERY_ZONES} />

      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
        <h2 className="text-text-primary text-lg font-bold">Создание зоны</h2>
        <ZoneForm disabled={pendingId === "create"} onSubmit={handleCreate} submitText="Создать" />
      </section>

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h2 className="text-text-primary font-bold">Список зон</h2>
          <span className="text-text-secondary text-sm">
            {zones.length} из {initialZones.total}
          </span>
        </div>
        {zones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Город</TableHeader>
                  <TableHeader>Зона</TableHeader>
                  <TableHeader>Стоимость</TableHeader>
                  <TableHeader>Бесплатно от</TableHeader>
                  <TableHeader>Минимум</TableHeader>
                  <TableHeader>Активность</TableHeader>
                  <TableHeader>Действия</TableHeader>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <ZoneRow
                    editing={editingZoneId === zone.id}
                    key={zone.id}
                    onCancel={() => setEditingZoneId(null)}
                    onDelete={() => handleDelete(zone.id)}
                    onEdit={() => setEditingZoneId(zone.id)}
                    onUpdate={(event) => handleUpdate(event, zone.id)}
                    pending={pendingId === zone.id}
                    zone={zone}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">Зоны доставки не найдены.</p>
        )}
        <Pagination
          filters={filters}
          page={initialZones.page}
          pages={initialZones.pages}
          route={ROUTES.ADMIN_DELIVERY_ZONES}
        />
      </section>
    </div>
  );
};

const ZoneRow = ({
  editing,
  onCancel,
  onDelete,
  onEdit,
  onUpdate,
  pending,
  zone,
}: {
  editing: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  zone: AdminDeliveryZoneResponse;
}) => {
  if (editing) {
    return (
      <tr className="border-border border-t">
        <td colSpan={7} className="p-4">
          <ZoneForm disabled={pending} onSubmit={onUpdate} submitText="Сохранить" zone={zone} />
          <button
            className="text-text-secondary hover:text-accent-primary mt-3 inline-flex items-center gap-2 text-sm font-bold"
            onClick={onCancel}
            type="button"
          >
            <X size={16} /> Отмена
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-border border-t align-top">
      <TableCell>{zone.city}</TableCell>
      <TableCell>
        <p className="font-bold">{zone.name}</p>
        <p className="text-text-muted mt-1 text-xs">{zone.description ?? `ID ${zone.id}`}</p>
      </TableCell>
      <TableCell>{formatMoney(zone.delivery_price)}</TableCell>
      <TableCell>{formatMoney(zone.free_delivery_from)}</TableCell>
      <TableCell>{formatMoney(zone.min_order_amount)}</TableCell>
      <TableCell>
        <StatusPill active={zone.is_active} />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <IconButton
            disabled={pending}
            icon={<Edit2 size={16} />}
            label="Редактировать"
            onClick={onEdit}
          />
          <IconButton
            danger
            disabled={pending}
            icon={<Trash2 size={16} />}
            label="Удалить"
            onClick={onDelete}
          />
        </div>
      </TableCell>
    </tr>
  );
};

const ZoneForm = ({
  disabled,
  onSubmit,
  submitText,
  zone,
}: {
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitText: string;
  zone?: AdminDeliveryZoneResponse;
}) => (
  <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}>
    <Input defaultValue={zone?.city} label="Город" name="city" required />
    <Input defaultValue={zone?.name} label="Название зоны" name="name" required />
    <Input
      defaultValue={zone?.delivery_price ?? undefined}
      label="Стоимость доставки"
      min="0"
      name="delivery_price"
      step="0.01"
      type="number"
    />
    <Input
      defaultValue={zone?.free_delivery_from ?? undefined}
      label="Бесплатно от"
      min="0"
      name="free_delivery_from"
      step="0.01"
      type="number"
    />
    <Input
      defaultValue={zone?.min_order_amount ?? undefined}
      label="Минимальная сумма"
      min="0"
      name="min_order_amount"
      step="0.01"
      type="number"
    />
    <Input
      defaultValue={zone ? String(zone.sort_order) : "0"}
      label="Сортировка"
      min="0"
      name="sort_order"
      step="1"
      type="number"
    />
    <SelectBoolean defaultValue={zone?.is_active ?? true} label="Активность" name="is_active" />
    <label className="md:col-span-2 xl:col-span-4">
      <span className="mb-2 block text-sm font-bold">Описание</span>
      <input
        className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        defaultValue={zone?.description ?? undefined}
        name="description"
      />
    </label>
    <button
      className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      <Save size={16} /> {submitText}
    </button>
  </form>
);

export const Filters = ({ filters, route }: { filters: AdminDeliveryFilters; route: string }) => (
  <form className="border-border bg-bg-primary shadow-soft rounded-lg border p-4" method="get">
    <div className="grid gap-3 md:grid-cols-4">
      <Input defaultValue={filters.q} label="Поиск" name="q" />
      <Input defaultValue={filters.city} label="Город" name="city" />
      <SelectString defaultValue={filters.is_active} label="Активность" name="is_active" />
      <input name="page" type="hidden" value="1" />
    </div>
    <div className="mt-4 flex gap-3">
      <button
        className="bg-accent-primary text-accent-contrast h-11 rounded-lg px-4 text-sm font-bold"
        type="submit"
      >
        Применить
      </button>
      <Link
        className="border-border hover:bg-bg-hover inline-flex h-11 items-center rounded-lg border px-4 text-sm font-bold"
        href={route}
      >
        Сбросить
      </Link>
    </div>
  </form>
);

export const Pagination = ({
  filters,
  page,
  pages,
  route,
}: {
  filters: AdminDeliveryFilters;
  page: number;
  pages: number;
  route: string;
}) => {
  const prev = Math.max(page - 1, 1);
  const next = Math.min(page + 1, pages || 1);
  return (
    <div className="border-border flex justify-end gap-2 border-t p-4">
      <PageLink disabled={page <= 1} href={makeHref(route, filters, prev)}>
        Назад
      </PageLink>
      <PageLink disabled={page >= pages} href={makeHref(route, filters, next)}>
        Вперед
      </PageLink>
    </div>
  );
};

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
      className="border-border bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm"
      defaultValue={String(defaultValue)}
      name={name}
    >
      <option value="true">Активна</option>
      <option value="false">Неактивна</option>
    </select>
  </label>
);

const SelectString = ({
  defaultValue,
  label,
  name,
}: {
  defaultValue: string;
  label: string;
  name: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold">{label}</span>
    <select
      className="border-border bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm"
      defaultValue={defaultValue}
      name={name}
    >
      <option value="">Все</option>
      <option value="true">Активные</option>
      <option value="false">Неактивные</option>
    </select>
  </label>
);

const IconButton = ({
  danger = false,
  disabled,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    className={
      danger
        ? "border-border text-error hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border"
        : "border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border"
    }
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {icon}
  </button>
);

const PageLink = ({
  children,
  disabled,
  href,
}: {
  children: ReactNode;
  disabled: boolean;
  href: string;
}) =>
  disabled ? (
    <span className="border-border text-text-muted rounded-lg border px-3 py-2 text-sm font-bold opacity-60">
      {children}
    </span>
  ) : (
    <Link
      className="border-border hover:bg-bg-hover rounded-lg border px-3 py-2 text-sm font-bold"
      href={href}
    >
      {children}
    </Link>
  );
const TableHeader = ({ children }: { children?: ReactNode }) => (
  <th className="px-4 py-3 font-bold">{children}</th>
);
const TableCell = ({ children }: { children: ReactNode }) => (
  <td className="px-4 py-4 text-sm">{children}</td>
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
const StatusPill = ({ active }: { active: boolean }) => (
  <span
    className={
      active
        ? "text-success inline-flex rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold"
        : "text-error inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold"
    }
  >
    {active ? "Активна" : "Неактивна"}
  </span>
);
const formatMoney = (value?: string | null): string => (value ? `${value} ₽` : "-");
const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};
const getNullableFormValue = (formData: FormData, key: string): string | null =>
  getRequiredFormValue(formData, key) || null;
const getNumberFormValue = (formData: FormData, key: string): number => {
  const value = Number(getRequiredFormValue(formData, key));
  return Number.isInteger(value) && value >= 0 ? value : 0;
};
const getZonePayload = (formData: FormData) => ({
  city: getRequiredFormValue(formData, "city"),
  delivery_price: getNullableFormValue(formData, "delivery_price"),
  description: getNullableFormValue(formData, "description"),
  free_delivery_from: getNullableFormValue(formData, "free_delivery_from"),
  is_active: formData.get("is_active") === "true",
  min_order_amount: getNullableFormValue(formData, "min_order_amount"),
  name: getRequiredFormValue(formData, "name"),
  sort_order: getNumberFormValue(formData, "sort_order"),
});
const makeHref = (route: string, filters: AdminDeliveryFilters, page: number): string => {
  const params = new URLSearchParams();
  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `${route}?${query}` : route;
};
