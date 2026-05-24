"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, UserX } from "lucide-react";
import {
  adminStaffApi,
  type AdminRoleResponse,
  type AdminStaffDetailResponse,
} from "@/entities/admin-staff";
import { ROUTES } from "@/shared/config";

interface AdminStaffDetailsViewProps {
  initialStaff: AdminStaffDetailResponse;
  roles: AdminRoleResponse[];
}

type PendingAction = "deactivate" | "delete" | "role" | "update";

export const AdminStaffDetailsView = ({ initialStaff, roles }: AdminStaffDetailsViewProps) => {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(initialStaff.role);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const currentRole = useMemo(() => {
    return roles.find((role) => role.code === staff.role) ?? null;
  }, [roles, staff.role]);

  const selectedRole = useMemo(() => {
    return roles.find((role) => role.code === selectedRoleCode) ?? currentRole;
  }, [currentRole, roles, selectedRoleCode]);

  const permissions =
    staff.permissions && staff.permissions.length > 0
      ? staff.permissions
      : (currentRole?.permissions ?? []);

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
      const response = await adminStaffApi.update(staff.id, {
        email: getNullableFormValue(formData, "email"),
        is_active: formData.get("is_active") === "true",
        name: getRequiredFormValue(formData, "name"),
        phone: getRequiredFormValue(formData, "phone"),
      });

      setStaff(response);
      setMessage("Данные сотрудника сохранены.");
    });
  };

  const handleRoleChange = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void runAction("role", async () => {
      const response = await adminStaffApi.changeRole(staff.id, {
        role: getRequiredFormValue(formData, "role"),
      });

      setStaff(response);
      setSelectedRoleCode(response.role);
      setMessage("Роль сотрудника изменена.");
    });
  };

  const handleDeactivate = (): void => {
    void runAction("deactivate", async () => {
      const response = await adminStaffApi.update(staff.id, {
        is_active: false,
      });

      setStaff(response);
      setMessage("Сотрудник деактивирован.");
    });
  };

  const handleDelete = (): void => {
    if (!window.confirm("Удалить сотрудника? Действие нельзя отменить.")) {
      return;
    }

    void runAction("delete", async () => {
      await adminStaffApi.delete(staff.id);
      router.push(ROUTES.ADMIN_STAFF);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
            href={ROUTES.ADMIN_STAFF}
          >
            <ArrowLeft size={16} />
            Сотрудники
          </Link>
          <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">{staff.name}</h1>
          <p className="text-text-secondary mt-2">
            ID {staff.id} · создан {formatDate(staff.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill active={staff.is_active} falseLabel="Неактивен" trueLabel="Активен" />
          <StatusPill
            active={!staff.is_blocked}
            falseLabel="Заблокирован"
            trueLabel="Не заблокирован"
          />
        </div>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Роль" value={currentRole?.name ?? staff.role} />
        <SummaryCard label="Permissions" value={permissions.length.toLocaleString("ru-RU")} />
        <SummaryCard label="Последний вход" value={formatNullableDate(staff.last_login_at)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card title="Данные сотрудника">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Имя" value={staff.name} />
              <DetailRow label="Телефон" value={staff.phone} />
              <DetailRow label="Email" value={staff.email ?? "-"} />
              <DetailRow label="Роль" value={currentRole?.name ?? staff.role} />
              <DetailRow label="Активность" value={staff.is_active ? "Активен" : "Неактивен"} />
              <DetailRow
                label="Блокировка"
                value={staff.is_blocked ? "Заблокирован" : "Не заблокирован"}
              />
              <DetailRow label="Создан" value={formatDate(staff.created_at)} />
              <DetailRow label="Обновлен" value={formatNullableDate(staff.updated_at)} />
            </div>
          </Card>

          <Card title="Permissions">
            {permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <span
                    className="border-border bg-bg-secondary rounded-lg border px-2.5 py-1 text-xs font-bold"
                    key={permission}
                  >
                    {permission}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">Permissions для роли не заданы.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Редактирование">
            <form className="space-y-3" onSubmit={handleUpdate}>
              <Input defaultValue={staff.name} label="Имя" name="name" required />
              <Input defaultValue={staff.phone} label="Телефон" name="phone" required />
              <Input defaultValue={staff.email ?? ""} label="Email" name="email" type="email" />
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Активность</span>
                <select
                  className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                  defaultValue={String(staff.is_active)}
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

          <Card title="Смена роли">
            <form className="space-y-3" onSubmit={handleRoleChange}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Роль</span>
                <select
                  className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                  name="role"
                  onChange={(event) => {
                    setSelectedRoleCode(event.target.value);
                  }}
                  value={selectedRoleCode}
                >
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton disabled={pendingAction === "role"} icon={<Save size={16} />}>
                Сменить роль
              </SubmitButton>
            </form>
            <RolePreview role={selectedRole} />
          </Card>

          <Card title="Опасная зона">
            <div className="space-y-3">
              <button
                className="border-border hover:bg-bg-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={pendingAction === "deactivate" || !staff.is_active}
                onClick={handleDeactivate}
                type="button"
              >
                <UserX size={16} />
                Деактивировать
              </button>
              <button
                className="bg-error inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                disabled={pendingAction === "delete"}
                onClick={handleDelete}
                type="button"
              >
                <Trash2 size={16} />
                Удалить
              </button>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
};

const RolePreview = ({ role }: { role: AdminRoleResponse | null }) => {
  if (!role) {
    return <p className="text-text-secondary mt-3 text-sm">Роль не выбрана.</p>;
  }

  return (
    <div className="border-border mt-4 border-t pt-4">
      <p className="text-text-primary text-sm font-bold">{role.name}</p>
      <p className="text-text-secondary mt-1 text-sm">{role.description}</p>
      <p className="text-text-muted mt-2 text-xs">
        Permissions: {role.permissions.length.toLocaleString("ru-RU")}
      </p>
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

const Input = ({
  defaultValue,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string;
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
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
};

const SubmitButton = ({
  children,
  disabled,
  icon,
}: {
  children: ReactNode;
  disabled: boolean;
  icon: ReactNode;
}) => {
  return (
    <button
      className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      {icon}
      {children}
    </button>
  );
};

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => {
  return (
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

const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const getNullableFormValue = (formData: FormData, key: string): string | null => {
  const value = getRequiredFormValue(formData, key);

  return value || null;
};

const formatNullableDate = (value?: string | null): string => {
  return value ? formatDate(value) : "-";
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
