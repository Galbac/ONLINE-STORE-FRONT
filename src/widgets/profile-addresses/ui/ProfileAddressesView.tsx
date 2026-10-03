"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Info, MapPin, Plus } from "lucide-react";
import {
  profileApi,
  type AddressCreateRequest,
  type AddressListResponse,
  type AddressResponse,
  type AddressUpdateRequest,
} from "@/entities/profile";
import { ROUTES } from "@/shared/config";
import { Container, getStoredAccessToken } from "@/shared/ui";
import { ProfileSidebar } from "@/widgets/profile-sidebar";
import type { Address } from "../types";
import { AddressCard } from "./AddressCard";
import { AddressModal } from "./AddressModal";

interface ProfileAddressesViewProps {
  initialAddresses?: AddressListResponse;
}

const LOCAL_STORAGE_KEY = "grocery_user_addresses";

const mapResponseToAddress = (item: AddressResponse): Address => ({
  id: String(item.id),
  city: item.city || "г. Кизляр",
  street: item.street,
  house: item.house,
  apartment: item.apartment ?? undefined,
  entrance: item.entrance ?? undefined,
  floor: item.floor ?? undefined,
  intercom: item.intercom ?? undefined,
  comment: item.comment ?? undefined,
  isDefault: item.is_default,
});

const sortAddresses = (items: Address[]): Address[] => {
  if (items.length === 0) return [];
  const hasDefault = items.some((item) => Boolean(item.isDefault));
  const normalized = hasDefault
    ? items
    : items.map((item, idx) => (idx === 0 ? { ...item, isDefault: true } : item));

  return [...normalized].sort((a, b) => {
    const aDef = Boolean(a.isDefault);
    const bDef = Boolean(b.isDefault);
    if (aDef && !bDef) return -1;
    if (!aDef && bDef) return 1;
    return 0;
  });
};

export const ProfileAddressesView = ({ initialAddresses }: ProfileAddressesViewProps) => {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (initialAddresses?.items && initialAddresses.items.length > 0) {
      return sortAddresses(initialAddresses.items.map(mapResponseToAddress));
    }
    return [];
  });

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Load addresses on mount
  useEffect(() => {
    setIsMounted(true);

    const token = getStoredAccessToken();

    let isSubscribed = true;

    const fetchAddresses = async () => {
      try {
        if (token) {
          const res = await profileApi.getAddresses(token);
          if (isSubscribed && res?.items) {
            const mapped = sortAddresses(res.items.map(mapResponseToAddress));
            setAddresses(mapped);
            try {
              window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
            } catch {
              // ignore storage quota error
            }
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // network or auth error, fallback to local storage
      }

      // Fallback to local storage if API call is unauthenticated or fails
      if (typeof window !== "undefined") {
        try {
          const cached = window.localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as Address[];
            if (isSubscribed && Array.isArray(parsed)) {
              setAddresses(sortAddresses(parsed));
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      if (isSubscribed) {
        setIsLoading(false);
      }
    };

    void fetchAddresses();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const saveToLocalCache = (newList: Address[]) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
      } catch {
        // ignore storage quota error
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async (formData: Omit<Address, "id">, addressId?: string) => {
    setIsSubmitting(true);
    const token = getStoredAccessToken();

    try {
      if (addressId) {
        // Edit mode
        let updatedAddress: Address = {
          ...formData,
          id: addressId,
        };

        if (token && !isNaN(Number(addressId))) {
          try {
            const updateReq: AddressUpdateRequest = {
              city: formData.city,
              street: formData.street,
              house: formData.house,
              apartment: formData.apartment ?? null,
              entrance: formData.entrance ?? null,
              floor: formData.floor ?? null,
              intercom: formData.intercom ?? null,
              comment: formData.comment ?? null,
              is_default: formData.isDefault,
            };
            const res = await profileApi.updateAddress(Number(addressId), updateReq, token);
            updatedAddress = mapResponseToAddress(res);
          } catch {
            // fallback to client update
          }
        }

        setAddresses((prev) => {
          const updated = prev.map((item) => {
            if (item.id === addressId) {
              return updatedAddress;
            }
            if (updatedAddress.isDefault) {
              return { ...item, isDefault: false };
            }
            return item;
          });
          const next = sortAddresses(updated);
          saveToLocalCache(next);
          return next;
        });

        
      } else {
        // Create mode
        const shouldBeDefault = formData.isDefault || addresses.length === 0;
        let createdAddress: Address = {
          ...formData,
          id: "local_" + Date.now().toString(),
          isDefault: shouldBeDefault,
        };

        if (token) {
          try {
            const createReq: AddressCreateRequest = {
              city: formData.city,
              street: formData.street,
              house: formData.house,
              apartment: formData.apartment ?? null,
              entrance: formData.entrance ?? null,
              floor: formData.floor ?? null,
              intercom: formData.intercom ?? null,
              comment: formData.comment ?? null,
              is_default: shouldBeDefault,
            };
            const res = await profileApi.createAddress(createReq, token);
            createdAddress = mapResponseToAddress(res);
          } catch {
            // fallback to client create
          }
        }

        setAddresses((prev) => {
          const updated = [
            createdAddress,
            ...prev.map((item) =>
              createdAddress.isDefault ? { ...item, isDefault: false } : item,
            ),
          ];
          const next = sortAddresses(updated);
          saveToLocalCache(next);
          return next;
        });

        
      }

      handleCloseModal();
    } catch {
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDefault = (address: Address) => {
    if (address.isDefault || isPending) return;

    startTransition(async () => {
      const token = getStoredAccessToken();

      if (token && !isNaN(Number(address.id))) {
        try {
          await profileApi.updateAddress(Number(address.id), { is_default: true }, token);
        } catch {
          // ignore backend error, still update local state
        }
      }

      setAddresses((prev) => {
        const updated = prev.map((item) => ({
          ...item,
          isDefault: item.id === address.id,
        }));
        const next = sortAddresses(updated);
        saveToLocalCache(next);
        return next;
      });

      
    });
  };

  const handleDelete = (address: Address) => {
    startTransition(async () => {
      const token = getStoredAccessToken();

      if (token && !isNaN(Number(address.id))) {
        try {
          await profileApi.deleteAddress(Number(address.id), token);
        } catch {
          // ignore backend error, still remove locally
        }
      }

      setAddresses((prev) => {
        const filtered = prev.filter((item) => item.id !== address.id);
        // If the removed address was default and there are remaining addresses, make the first one default
        if (address.isDefault && filtered.length > 0 && filtered[0]) {
          filtered[0] = { ...filtered[0], isDefault: true };
        }
        const next = sortAddresses(filtered);
        saveToLocalCache(next);
        return next;
      });
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh] py-6 sm:py-8">
      <Container>
        {/* Breadcrumbs */}
        <nav className="text-text-secondary mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-emerald-600 transition-colors" href={ROUTES.HOME}>
            Главная
          </Link>
          <span className="text-slate-400">/</span>
          <Link className="hover:text-emerald-600 transition-colors" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-medium">Адреса доставки</span>
        </nav>

        {/* Layout: Sidebar on left, Content on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
          <ProfileSidebar activeItem="addresses" />

          <div className="min-w-0 space-y-6">
            {/* Header section: Header button is rendered ONLY when addresses.length > 0 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Адреса доставки
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Управляйте адресами доставки и выбирайте основной адрес для быстрого оформления
                  заказа
                </p>
              </div>

              {isMounted && !isLoading && addresses.length > 0 ? (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Добавить адрес</span>
                </button>
              ) : null}
            </div>

            {/* Content states: Skeleton / Saved Addresses / Empty State */}
            {!isMounted || isLoading ? (
              <div className="space-y-4">
                <div className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
                <div className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isPending={isPending}
                    onSelectDefault={handleSelectDefault}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* Empty state with CTA button */
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-12 text-center shadow-xs">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                  <MapPin size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Адресов пока нет</h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
                  Добавьте адрес доставки, чтобы быстрее оформлять заказы и рассчитывать стоимость
                  доставки.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 shadow-xs cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Добавить адрес</span>
                </button>
              </div>
            )}

            {/* Helper tip: Shown ONLY when addresses.length >= 2 */}
            {isMounted && !isLoading && addresses.length >= 2 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5 flex items-start gap-3.5 transition-all">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Как выбрать адрес для доставки
                  </h4>
                  <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Выберите адрес, отметив его галочкой. Он будет использоваться по умолчанию при
                    оформлении заказа.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>

      {/* Interactive Modal */}
      <AddressModal
        isOpen={isModalOpen}
        initialData={editingAddress}
        onClose={handleCloseModal}
        onSave={handleSaveAddress}
        isSubmitting={isSubmitting}
      />
    </main>
  );
};
