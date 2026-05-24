"use client";

import { type FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Headphones,
  Home,
  Info,
  MapPin,
  Pencil,
  Percent,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  profileApi,
  type AddressCreateRequest,
  type AddressListResponse,
  type AddressResponse,
  type AddressUpdateRequest,
} from "@/entities/profile";
import { cn, ROUTES } from "@/shared/config";
import { Button, Container } from "@/shared/ui";

interface ProfileAddressesViewProps {
  initialAddresses: AddressListResponse;
}

interface AddressFormValues {
  apartment: string;
  building: string;
  city: string;
  comment: string;
  entrance: string;
  floor: string;
  house: string;
  intercom: string;
  isDefault: boolean;
  street: string;
  title: string;
}

type FormMode = "create" | "edit";

const emptyFormValues: AddressFormValues = {
  apartment: "",
  building: "",
  city: "",
  comment: "",
  entrance: "",
  floor: "",
  house: "",
  intercom: "",
  isDefault: false,
  street: "",
  title: "",
};

const serviceBenefits = [
  {
    title: "Качество продуктов",
    text: "Только свежие и проверенные товары каждый день",
    icon: BadgeCheck,
  },
  {
    title: "Доставка",
    text: "Быстрая доставка на дом и в удобное время",
    icon: Truck,
  },
  {
    title: "Выгодные цены",
    text: "Лучшие предложения и акции для вас",
    icon: Percent,
  },
  {
    title: "Поддержка 24/7",
    text: "Мы всегда на связи и готовы помочь",
    icon: Headphones,
  },
] as const;

export const ProfileAddressesView = ({ initialAddresses }: ProfileAddressesViewProps) => {
  const [addresses, setAddresses] = useState<AddressResponse[]>(initialAddresses.items);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<AddressFormValues>(emptyFormValues);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadAddresses = async (): Promise<void> => {
      try {
        const response = await profileApi.getAddresses(accessToken);

        if (isMounted) {
          setAddresses(response.items);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Не удалось загрузить сохраненные адреса.");
        }
      }
    };

    void loadAddresses();

    return () => {
      isMounted = false;
    };
  }, []);

  const defaultAddressId = useMemo(() => {
    return addresses.find((address) => address.is_default)?.id ?? null;
  }, [addresses]);

  const handleCreateOpen = (): void => {
    setFormMode("create");
    setEditingAddressId(null);
    setFormValues({
      ...emptyFormValues,
      isDefault: addresses.length === 0,
    });
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleEditOpen = (address: AddressResponse): void => {
    setFormMode("edit");
    setEditingAddressId(address.id);
    setFormValues(toFormValues(address));
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleCloseForm = (): void => {
    setFormMode(null);
    setEditingAddressId(null);
    setFormValues(emptyFormValues);
  };

  const handleFormChange = (field: keyof AddressFormValues, value: string | boolean): void => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const validationMessage = validateAddress(formValues);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setStatusMessage(null);
      return;
    }

    const accessToken = getAccessToken();
    const request = toAddressRequest(formValues);

    startTransition(async () => {
      try {
        setPendingAction("save");
        setErrorMessage(null);

        if (formMode === "edit" && editingAddressId !== null) {
          const updatedAddress = await profileApi.updateAddress(
            editingAddressId,
            request,
            accessToken,
          );

          setAddresses((currentAddresses) =>
            currentAddresses.map((address) => {
              if (updatedAddress.is_default && address.id !== updatedAddress.id) {
                return { ...address, is_default: false };
              }

              return address.id === updatedAddress.id ? updatedAddress : address;
            }),
          );
          setStatusMessage("Адрес обновлен.");
        } else {
          const createdAddress = await profileApi.createAddress(request, accessToken);

          setAddresses((currentAddresses) => {
            const nextAddresses = createdAddress.is_default
              ? currentAddresses.map((address) => ({ ...address, is_default: false }))
              : currentAddresses;

            return [createdAddress, ...nextAddresses];
          });
          setStatusMessage("Адрес добавлен.");
        }

        handleCloseForm();
      } catch {
        setErrorMessage("Не удалось сохранить адрес. Проверьте данные и попробуйте снова.");
        setStatusMessage(null);
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleSelectDefault = (address: AddressResponse): void => {
    if (address.is_default || isPending) {
      return;
    }

    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingAction(`select-${address.id}`);
        setErrorMessage(null);

        const updatedAddress = await profileApi.updateAddress(
          address.id,
          { is_default: true },
          accessToken,
        );

        setAddresses((currentAddresses) =>
          currentAddresses.map((currentAddress) => ({
            ...currentAddress,
            is_default: currentAddress.id === updatedAddress.id,
          })),
        );
        setStatusMessage("Адрес выбран для доставки.");
      } catch {
        setErrorMessage("Не удалось выбрать адрес. Попробуйте еще раз.");
        setStatusMessage(null);
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleDelete = (address: AddressResponse): void => {
    const isConfirmed = window.confirm(`Удалить адрес "${getAddressTitle(address)}"?`);

    if (!isConfirmed) {
      return;
    }

    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingAction(`delete-${address.id}`);
        setErrorMessage(null);
        await profileApi.deleteAddress(address.id, accessToken);
        setAddresses((currentAddresses) =>
          currentAddresses.filter((currentAddress) => currentAddress.id !== address.id),
        );
        setStatusMessage("Адрес удален.");

        if (editingAddressId === address.id) {
          handleCloseForm();
        }
      } catch {
        setErrorMessage("Не удалось удалить адрес. Возможно, он используется в активном заказе.");
        setStatusMessage(null);
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-9 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <span>Адреса</span>
        </nav>

        <section className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Мои адреса</h1>
            <p className="text-text-secondary mt-4 max-w-2xl">
              Управляйте адресами доставки и выбирайте основной адрес для оформления заказа.
            </p>
          </div>
          <Button
            className="h-14 w-full gap-3 text-base sm:w-auto"
            disabled={isPending}
            onClick={handleCreateOpen}
          >
            <Plus size={22} />
            Добавить адрес
          </Button>
        </section>

        {errorMessage ? (
          <StatusPanel tone="error" text={errorMessage} />
        ) : statusMessage ? (
          <StatusPanel tone="success" text={statusMessage} />
        ) : null}

        {formMode ? (
          <AddressForm
            isPending={isPending && pendingAction === "save"}
            mode={formMode}
            values={formValues}
            onChange={handleFormChange}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
          />
        ) : null}

        <section className="mt-6 space-y-5">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <AddressCard
                address={address}
                isPending={isPending}
                isSelected={address.id === defaultAddressId}
                key={address.id}
                pendingAction={pendingAction}
                onDelete={handleDelete}
                onEdit={handleEditOpen}
                onSelect={handleSelectDefault}
              />
            ))
          ) : (
            <EmptyAddresses onCreate={handleCreateOpen} />
          )}
        </section>

        <section className="border-success/20 bg-bg-secondary mt-9 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:p-7">
          <span className="bg-accent-primary text-accent-contrast grid size-12 shrink-0 place-items-center rounded-full">
            <Info size={26} />
          </span>
          <div>
            <p className="text-text-primary font-bold">Как выбрать адрес для доставки</p>
            <p className="text-text-secondary mt-2 text-sm leading-6">
              Выберите адрес, отметив его галочкой. Он будет использоваться при оформлении заказа.
            </p>
          </div>
        </section>

        <section className="border-border mt-9 grid gap-5 rounded-lg border bg-white p-6 shadow-[0_10px_28px_rgb(20_28_18/0.04)] md:grid-cols-2 lg:grid-cols-4">
          {serviceBenefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div className="flex gap-4" key={benefit.title}>
                <span className="bg-bg-hover text-accent-primary grid size-14 shrink-0 place-items-center rounded-full border border-green-100">
                  <Icon size={28} />
                </span>
                <span>
                  <span className="block font-bold">{benefit.title}</span>
                  <span className="text-text-secondary mt-2 block text-sm leading-6">
                    {benefit.text}
                  </span>
                </span>
              </div>
            );
          })}
        </section>
      </Container>
    </main>
  );
};

interface AddressCardProps {
  address: AddressResponse;
  isPending: boolean;
  isSelected: boolean;
  pendingAction: string | null;
  onDelete: (address: AddressResponse) => void;
  onEdit: (address: AddressResponse) => void;
  onSelect: (address: AddressResponse) => void;
}

const AddressCard = ({
  address,
  isPending,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
  pendingAction,
}: AddressCardProps) => {
  const Icon = getAddressIcon(address.title);

  return (
    <article className="border-border rounded-lg border bg-white p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:p-8">
      <div className="grid gap-5 md:grid-cols-[44px_88px_minmax(0,1fr)] lg:grid-cols-[44px_96px_minmax(0,1fr)_auto] lg:items-center">
        <button
          className={cn(
            "grid size-9 place-items-center rounded-full border-2 transition",
            isSelected
              ? "border-accent-primary text-accent-primary"
              : "border-text-muted hover:border-accent-primary text-transparent",
          )}
          type="button"
          disabled={isPending}
          onClick={() => onSelect(address)}
          aria-label="Выбрать адрес для доставки"
        >
          <CheckCircle2 size={24} />
        </button>

        <span className="bg-bg-hover text-accent-primary grid size-16 place-items-center rounded-full border border-green-100 md:size-20">
          <Icon size={34} />
        </span>

        <div className="min-w-0">
          {isSelected ? (
            <span className="bg-bg-hover text-accent-primary mb-4 inline-flex rounded-lg px-4 py-2 text-sm font-bold">
              Основной адрес
            </span>
          ) : null}
          <h2 className="text-text-primary text-xl font-bold">{getAddressTitle(address)}</h2>
          <p className="mt-2 text-lg leading-7 break-words">{formatAddressLine(address)}</p>
          <p className="text-text-secondary mt-2 leading-7 break-words">
            {formatAddressDetails(address)}
          </p>
          {address.comment ? (
            <p className="text-text-secondary mt-2 text-sm leading-6 break-words">
              {address.comment}
            </p>
          ) : null}
          <p className="text-text-muted mt-3 text-xs">
            Создан {formatDateTime(address.created_at)} · обновлен{" "}
            {formatDateTime(address.updated_at)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[330px]">
          <Button
            className="gap-2"
            variant="secondary"
            disabled={isPending}
            onClick={() => onEdit(address)}
          >
            <Pencil size={18} />
            Редактировать
          </Button>
          <Button
            className="text-error gap-2 border-red-100 bg-white hover:bg-red-50"
            variant="secondary"
            disabled={isPending || pendingAction === `delete-${address.id}`}
            onClick={() => onDelete(address)}
          >
            <Trash2 size={18} />
            Удалить
          </Button>
        </div>
      </div>
    </article>
  );
};

interface AddressFormProps {
  isPending: boolean;
  mode: FormMode;
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const AddressForm = ({
  isPending,
  mode,
  onChange,
  onClose,
  onSubmit,
  values,
}: AddressFormProps) => {
  return (
    <form
      className="border-border mt-6 rounded-lg border bg-white p-5 shadow-[0_14px_42px_rgb(28_43_22/0.08)] md:p-8"
      onSubmit={onSubmit}
    >
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-text-primary text-2xl font-bold">
          {mode === "create" ? "Новый адрес" : "Редактирование адреса"}
        </h2>
        <button
          className="text-text-muted hover:text-text-primary inline-flex items-center gap-2 text-sm font-bold transition"
          type="button"
          onClick={onClose}
        >
          <X size={18} />
          Закрыть
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AddressField
          label="Название"
          placeholder="Дом, работа"
          value={values.title}
          onChange={(value) => onChange("title", value)}
        />
        <AddressField
          required
          label="Город"
          value={values.city}
          onChange={(value) => onChange("city", value)}
        />
        <AddressField
          required
          className="md:col-span-2"
          label="Улица"
          placeholder="Улица"
          value={values.street}
          onChange={(value) => onChange("street", value)}
        />
        <AddressField
          required
          label="Дом"
          value={values.house}
          onChange={(value) => onChange("house", value)}
        />
        <AddressField
          label="Корпус"
          value={values.building}
          onChange={(value) => onChange("building", value)}
        />
        <AddressField
          label="Квартира"
          value={values.apartment}
          onChange={(value) => onChange("apartment", value)}
        />
        <AddressField
          label="Подъезд"
          value={values.entrance}
          onChange={(value) => onChange("entrance", value)}
        />
        <AddressField
          label="Этаж"
          value={values.floor}
          onChange={(value) => onChange("floor", value)}
        />
        <AddressField
          label="Домофон"
          value={values.intercom}
          onChange={(value) => onChange("intercom", value)}
        />
        <AddressField
          className="md:col-span-2"
          label="Комментарий"
          placeholder="Ориентир или пожелание для курьера"
          value={values.comment}
          onChange={(value) => onChange("comment", value)}
        />
      </div>

      <label className="mt-6 inline-flex items-center gap-3 text-sm font-bold">
        <input
          className="accent-accent-primary size-5"
          type="checkbox"
          checked={values.isDefault}
          onChange={(event) => onChange("isDefault", event.target.checked)}
        />
        Использовать как основной адрес доставки
      </label>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button className="gap-2 sm:min-w-44" type="submit" disabled={isPending}>
          <Save size={19} />
          {isPending ? "Сохраняем..." : "Сохранить"}
        </Button>
        <Button className="sm:min-w-36" variant="secondary" type="button" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </form>
  );
};

interface AddressFieldProps {
  label: string;
  value: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}

const AddressField = ({
  className,
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: AddressFieldProps) => {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-bold">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      <input
        className="border-border focus:border-accent-primary placeholder:text-text-muted h-12 w-full rounded-lg border bg-white px-4 text-sm transition outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
};

interface StatusPanelProps {
  text: string;
  tone: "error" | "success";
}

const StatusPanel = ({ text, tone }: StatusPanelProps) => {
  return (
    <div
      className={cn(
        "mb-5 rounded-lg border px-5 py-4 text-sm font-bold",
        tone === "error" && "text-error border-red-100 bg-red-50",
        tone === "success" && "bg-bg-hover text-accent-primary border-green-100",
      )}
    >
      {text}
    </div>
  );
};

interface EmptyAddressesProps {
  onCreate: () => void;
}

const EmptyAddresses = ({ onCreate }: EmptyAddressesProps) => {
  return (
    <section className="border-border rounded-lg border bg-white p-8 text-center shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <span className="bg-bg-hover text-accent-primary mx-auto grid size-16 place-items-center rounded-full">
        <MapPin size={34} />
      </span>
      <h2 className="text-text-primary mt-5 text-2xl font-bold">Адресов пока нет</h2>
      <p className="text-text-secondary mx-auto mt-3 max-w-xl leading-7">
        Добавьте адрес доставки, чтобы быстрее оформлять заказы и рассчитывать доставку.
      </p>
      <Button className="mt-7 gap-3" onClick={onCreate}>
        <Plus size={20} />
        Добавить адрес
      </Button>
    </section>
  );
};

const getAccessToken = (): string | null => {
  return (
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token")
  );
};

const toFormValues = (address: AddressResponse): AddressFormValues => {
  return {
    apartment: address.apartment ?? "",
    building: address.building ?? "",
    city: address.city,
    comment: address.comment ?? "",
    entrance: address.entrance ?? "",
    floor: address.floor ?? "",
    house: address.house,
    intercom: address.intercom ?? "",
    isDefault: address.is_default,
    street: address.street,
    title: address.title ?? "",
  };
};

const toAddressRequest = (
  values: AddressFormValues,
): AddressCreateRequest & AddressUpdateRequest => {
  return {
    apartment: normalizeOptionalField(values.apartment),
    building: normalizeOptionalField(values.building),
    city: values.city.trim(),
    comment: normalizeOptionalField(values.comment),
    entrance: normalizeOptionalField(values.entrance),
    floor: normalizeOptionalField(values.floor),
    house: values.house.trim(),
    intercom: normalizeOptionalField(values.intercom),
    is_default: values.isDefault,
    street: values.street.trim(),
    title: normalizeOptionalField(values.title),
  };
};

const normalizeOptionalField = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

const validateAddress = (values: AddressFormValues): string | null => {
  if (!values.city.trim()) {
    return "Укажите город.";
  }

  if (!values.street.trim()) {
    return "Укажите улицу.";
  }

  if (!values.house.trim()) {
    return "Укажите дом.";
  }

  return null;
};

const getAddressTitle = (address: AddressResponse): string => {
  return address.title?.trim() || "Адрес доставки";
};

const formatDateTime = (value: string): string => {
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

const formatAddressLine = (address: AddressResponse): string => {
  const building = address.building ? `, корп. ${address.building}` : "";
  const apartment = address.apartment ? `, кв. ${address.apartment}` : "";

  return `Россия, ${address.city}, ул. ${address.street}, д. ${address.house}${building}${apartment}`;
};

const formatAddressDetails = (address: AddressResponse): string => {
  const details = [
    address.entrance ? `Подъезд ${address.entrance}` : null,
    address.floor ? `этаж ${address.floor}` : null,
    address.intercom ? `домофон ${address.intercom}` : null,
  ].filter(Boolean);

  return details.length > 0 ? details.join(", ") : "Дополнительные детали не указаны";
};

const getAddressIcon = (title?: string | null) => {
  const normalizedTitle = title?.toLowerCase() ?? "";

  if (normalizedTitle.includes("работ")) {
    return BriefcaseBusiness;
  }

  if (normalizedTitle.includes("дом")) {
    return Home;
  }

  if (normalizedTitle.includes("дач")) {
    return Plus;
  }

  return MapPin;
};
