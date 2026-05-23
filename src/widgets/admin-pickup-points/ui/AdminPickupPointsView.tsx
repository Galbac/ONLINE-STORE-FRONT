"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Edit2, Save, Trash2, X } from "lucide-react";
import {
  adminDeliveryApi,
  type AdminPickupPointListResponse,
  type AdminPickupPointResponse,
} from "@/entities/admin-delivery";
import { ROUTES } from "@/shared/config";
import { DeliveryTabs } from "@/widgets/admin-delivery-settings";
import { Filters, Pagination, type AdminDeliveryFilters } from "@/widgets/admin-delivery-zones";

interface AdminPickupPointsViewProps {
  filters: AdminDeliveryFilters;
  pickupPoints: AdminPickupPointListResponse;
}

export const AdminPickupPointsView = ({
  filters,
  pickupPoints: initialPickupPoints,
}: AdminPickupPointsViewProps) => {
  const [pickupPoints, setPickupPoints] = useState(initialPickupPoints.items);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
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
      .createPickupPoint(getPickupPointPayload(formData))
      .then((point) => {
        setPickupPoints((current) => [point, ...current]);
        event.currentTarget.reset();
        setMessage("Точка самовывоза создана.");
      })
      .catch(() => setError("Не удалось создать точку самовывоза."))
      .finally(() => setPendingId(null));
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, pointId: number): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPendingId(pointId);
    setMessage(null);
    setError(null);

    void adminDeliveryApi
      .updatePickupPoint(pointId, getPickupPointPayload(formData))
      .then((point) => {
        setPickupPoints((current) => current.map((item) => (item.id === point.id ? point : item)));
        setEditingPointId(null);
        setMessage("Точка самовывоза сохранена.");
      })
      .catch(() => setError("Не удалось сохранить точку самовывоза."))
      .finally(() => setPendingId(null));
  };

  const handleDelete = (pointId: number): void => {
    if (!window.confirm("Удалить точку самовывоза?")) return;
    setPendingId(pointId);
    setMessage(null);
    setError(null);

    void adminDeliveryApi
      .deletePickupPoint(pointId)
      .then((response) => {
        setPickupPoints((current) => current.filter((point) => point.id !== pointId));
        setMessage(response.message);
      })
      .catch(() => setError("Не удалось удалить точку самовывоза."))
      .finally(() => setPendingId(null));
  };

  return (
    <div className="space-y-6">
      <DeliveryTabs />
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Точки самовывоза</h1>
        <p className="text-text-secondary mt-2">
          Адреса, график работы, контакты, координаты и активность пунктов.
        </p>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Filters filters={filters} route={ROUTES.ADMIN_DELIVERY_PICKUP_POINTS} />

      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
        <h2 className="text-text-primary text-lg font-bold">Создание точки</h2>
        <PickupPointForm
          disabled={pendingId === "create"}
          onSubmit={handleCreate}
          submitText="Создать"
        />
      </section>

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h2 className="text-text-primary font-bold">Список точек</h2>
          <span className="text-text-secondary text-sm">
            {pickupPoints.length} из {initialPickupPoints.total}
          </span>
        </div>
        {pickupPoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Город</TableHeader>
                  <TableHeader>Название и адрес</TableHeader>
                  <TableHeader>Режим</TableHeader>
                  <TableHeader>Телефон</TableHeader>
                  <TableHeader>Координаты</TableHeader>
                  <TableHeader>Активность</TableHeader>
                  <TableHeader>Действия</TableHeader>
                </tr>
              </thead>
              <tbody>
                {pickupPoints.map((point) => (
                  <PickupPointRow
                    editing={editingPointId === point.id}
                    key={point.id}
                    onCancel={() => setEditingPointId(null)}
                    onDelete={() => handleDelete(point.id)}
                    onEdit={() => setEditingPointId(point.id)}
                    onUpdate={(event) => handleUpdate(event, point.id)}
                    pending={pendingId === point.id}
                    point={point}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">Точки самовывоза не найдены.</p>
        )}
        <Pagination
          filters={filters}
          page={initialPickupPoints.page}
          pages={initialPickupPoints.pages}
          route={ROUTES.ADMIN_DELIVERY_PICKUP_POINTS}
        />
      </section>
    </div>
  );
};

const PickupPointRow = ({
  editing,
  onCancel,
  onDelete,
  onEdit,
  onUpdate,
  pending,
  point,
}: {
  editing: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  point: AdminPickupPointResponse;
}) => {
  if (editing) {
    return (
      <tr className="border-border border-t">
        <td className="p-4" colSpan={7}>
          <PickupPointForm
            disabled={pending}
            onSubmit={onUpdate}
            point={point}
            submitText="Сохранить"
          />
          <button
            className="text-text-secondary hover:text-accent-primary mt-3 inline-flex items-center gap-2 text-sm font-bold"
            onClick={onCancel}
            type="button"
          >
            <X size={16} />
            Отмена
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-border border-t align-top">
      <TableCell>{point.city}</TableCell>
      <TableCell>
        <p className="font-bold">{point.name}</p>
        <p className="text-text-muted mt-1 text-xs">{point.address}</p>
      </TableCell>
      <TableCell>{point.working_hours ?? "-"}</TableCell>
      <TableCell>{point.phone ?? "-"}</TableCell>
      <TableCell>
        {point.latitude && point.longitude ? `${point.latitude}, ${point.longitude}` : "-"}
      </TableCell>
      <TableCell>
        <StatusPill active={point.is_active} />
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

const PickupPointForm = ({
  disabled,
  onSubmit,
  point,
  submitText,
}: {
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  point?: AdminPickupPointResponse;
  submitText: string;
}) => (
  <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}>
    <Input defaultValue={point?.city} label="Город" name="city" required />
    <Input defaultValue={point?.name} label="Название" name="name" required />
    <Input defaultValue={point?.address} label="Адрес" name="address" required />
    <Input
      defaultValue={point?.working_hours ?? undefined}
      label="Режим работы"
      name="working_hours"
    />
    <Input defaultValue={point?.phone ?? undefined} label="Телефон" name="phone" />
    <Input defaultValue={point?.latitude ?? undefined} label="Широта" name="latitude" />
    <Input defaultValue={point?.longitude ?? undefined} label="Долгота" name="longitude" />
    <Input
      defaultValue={point ? String(point.sort_order) : "0"}
      label="Сортировка"
      min="0"
      name="sort_order"
      step="1"
      type="number"
    />
    <SelectBoolean defaultValue={point?.is_active ?? true} label="Активность" name="is_active" />
    <label className="md:col-span-2 xl:col-span-4">
      <span className="mb-2 block text-sm font-bold">Описание</span>
      <input
        className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        defaultValue={point?.description ?? undefined}
        name="description"
      />
    </label>
    <button
      className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      <Save size={16} />
      {submitText}
    </button>
  </form>
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
const getPickupPointPayload = (formData: FormData) => ({
  address: getRequiredFormValue(formData, "address"),
  city: getRequiredFormValue(formData, "city"),
  description: getNullableFormValue(formData, "description"),
  is_active: formData.get("is_active") === "true",
  latitude: getNullableFormValue(formData, "latitude"),
  longitude: getNullableFormValue(formData, "longitude"),
  name: getRequiredFormValue(formData, "name"),
  phone: getNullableFormValue(formData, "phone"),
  sort_order: getNumberFormValue(formData, "sort_order"),
  working_hours: getNullableFormValue(formData, "working_hours"),
});
