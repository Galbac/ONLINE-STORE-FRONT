"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { adminStaffApi, type AdminRoleResponse } from "@/entities/admin-staff";
import { ROUTES } from "@/shared/config";

interface AdminStaffCreateViewProps {
  roles: AdminRoleResponse[];
}

export const AdminStaffCreateView = ({ roles }: AdminStaffCreateViewProps) => {
  const router = useRouter();
  const defaultRole = roles[0]?.code ?? "";
  const [selectedRoleCode, setSelectedRoleCode] = useState(defaultRole);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = useMemo(() => {
    return roles.find((role) => role.code === selectedRoleCode) ?? roles[0] ?? null;
  }, [roles, selectedRoleCode]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsPending(true);
    setError(null);

    void adminStaffApi
      .create({
        email: getNullableFormValue(formData, "email"),
        is_active: formData.get("is_active") === "true",
        name: getRequiredFormValue(formData, "name"),
        password: getRequiredFormValue(formData, "password"),
        phone: getRequiredFormValue(formData, "phone"),
        role: getRequiredFormValue(formData, "role"),
      })
      .then((staff) => {
        router.push(ROUTES.ADMIN_STAFF_DETAILS(staff.id));
        router.refresh();
      })
      .catch(() => {
        setError("Не удалось создать сотрудника. Проверьте поля и права доступа.");
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <div className="space-y-6">
      <section>
        <Link
          className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
          href={ROUTES.ADMIN_STAFF}
        >
          <ArrowLeft size={16} />
          Сотрудники
        </Link>
        <h1 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">
          Создание сотрудника
        </h1>
        <p className="text-text-secondary mt-2">
          Укажите контакты, пароль, роль и активность учетной записи.
        </p>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form
          className="border-border bg-bg-primary shadow-soft rounded-lg border p-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Имя" name="name" required />
            <Input label="Телефон" name="phone" required type="tel" />
            <Input label="Email" name="email" type="email" />
            <Input label="Пароль" name="password" required type="password" />
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Роль</span>
              <select
                className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                name="role"
                onChange={(event) => {
                  setSelectedRoleCode(event.target.value);
                }}
                required
                value={selectedRoleCode}
              >
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Активность</span>
              <select
                className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                defaultValue="true"
                name="is_active"
              >
                <option value="true">Активен</option>
                <option value="false">Неактивен</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
              disabled={isPending || roles.length === 0}
              type="submit"
            >
              <Save size={16} />
              Создать сотрудника
            </button>
            <Link
              className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
              href={ROUTES.ADMIN_STAFF}
            >
              Отмена
            </Link>
          </div>
        </form>

        <RolePermissionsCard role={selectedRole} />
      </section>
    </div>
  );
};

const RolePermissionsCard = ({ role }: { role: AdminRoleResponse | null }) => {
  return (
    <aside className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <h2 className="text-text-primary text-lg font-bold">Permissions роли</h2>
      {role ? (
        <>
          <p className="text-text-secondary mt-2 text-sm">{role.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {role.permissions.length > 0 ? (
              role.permissions.map((permission) => (
                <span
                  className="border-border bg-bg-secondary rounded-lg border px-2.5 py-1 text-xs font-bold"
                  key={permission}
                >
                  {permission}
                </span>
              ))
            ) : (
              <p className="text-text-secondary text-sm">Для роли permissions не заданы.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-text-secondary mt-2 text-sm">Роли не загружены.</p>
      )}
    </aside>
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

const getRequiredFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const getNullableFormValue = (formData: FormData, key: string): string | null => {
  const value = getRequiredFormValue(formData, key);

  return value || null;
};
