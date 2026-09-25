"use client";

import { type FormEvent, useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import type { Address } from "../types";

interface AddressModalProps {
  isOpen: boolean;
  initialData?: Address | null;
  onClose: () => void;
  onSave: (data: Omit<Address, "id">, id?: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

interface FormState {
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  isDefault: boolean;
}

interface FormErrors {
  street?: string | undefined;
  house?: string | undefined;
}

const DEFAULT_CITY = "г. Кизляр";

export const AddressModal = ({
  isOpen,
  initialData,
  onClose,
  onSave,
  isSubmitting = false,
}: AddressModalProps) => {
  const [formData, setFormData] = useState<FormState>({
    city: DEFAULT_CITY,
    street: "",
    house: "",
    apartment: "",
    entrance: "",
    floor: "",
    intercom: "",
    comment: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          city: initialData.city || DEFAULT_CITY,
          street: initialData.street || "",
          house: initialData.house || "",
          apartment: initialData.apartment || "",
          entrance: initialData.entrance || "",
          floor: initialData.floor || "",
          intercom: initialData.intercom || "",
          comment: initialData.comment || "",
          isDefault: initialData.isDefault ?? false,
        });
      } else {
        setFormData({
          city: DEFAULT_CITY,
          street: "",
          house: "",
          apartment: "",
          entrance: "",
          floor: "",
          intercom: "",
          comment: "",
          isDefault: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.street.trim()) {
      newErrors.street = "Укажите улицу";
    }
    if (!formData.house.trim()) {
      newErrors.house = "Укажите номер дома";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave(
      {
        city: formData.city.trim() || DEFAULT_CITY,
        street: formData.street.trim(),
        house: formData.house.trim(),
        apartment: formData.apartment.trim() || undefined,
        entrance: formData.entrance.trim() || undefined,
        floor: formData.floor.trim() || undefined,
        intercom: formData.intercom.trim() || undefined,
        comment: formData.comment.trim() || undefined,
        isDefault: formData.isDefault,
      },
      initialData?.id,
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-200/80 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h2 id="address-modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
              {initialData ? "Редактировать адрес" : "Новый адрес доставки"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Город
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/70 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden"
              placeholder="г. Кизляр"
            />
          </div>

          {/* Street & House */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Улица <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => {
                  setFormData({ ...formData, street: e.target.value });
                  if (errors.street) {
                    const next = { ...errors };
                    delete next.street;
                    setErrors(next);
                  }
                }}
                className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 transition-all outline-hidden ${
                  errors.street
                    ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-200 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
                placeholder="ул. Ленина"
              />
              {errors.street && (
                <span className="mt-1 block text-xs text-rose-500">{errors.street}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Дом <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.house}
                onChange={(e) => {
                  setFormData({ ...formData, house: e.target.value });
                  if (errors.house) {
                    const next = { ...errors };
                    delete next.house;
                    setErrors(next);
                  }
                }}
                className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 transition-all outline-hidden ${
                  errors.house
                    ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-200 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
                placeholder="12"
              />
              {errors.house && (
                <span className="mt-1 block text-xs text-rose-500">{errors.house}</span>
              )}
            </div>
          </div>

          {/* Apartment, Entrance, Floor, Intercom */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Квартира
              </label>
              <input
                type="text"
                value={formData.apartment}
                onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden"
                placeholder="кв. 42"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Подъезд
              </label>
              <input
                type="text"
                value={formData.entrance}
                onChange={(e) => setFormData({ ...formData, entrance: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Этаж
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden"
                placeholder="4"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Домофон
              </label>
              <input
                type="text"
                value={formData.intercom}
                onChange={(e) => setFormData({ ...formData, intercom: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden"
                placeholder="42#"
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Комментарий для курьера
            </label>
            <textarea
              rows={2}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden resize-none"
              placeholder="Ориентир, код от калитки или пожелание по доставке"
            />
          </div>

          {/* isDefault checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="size-4.5 rounded-md border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                Сделать основным адресом доставки
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            >
              {isSubmitting
                ? "Сохранение..."
                : initialData
                  ? "Сохранить изменения"
                  : "Добавить адрес"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
