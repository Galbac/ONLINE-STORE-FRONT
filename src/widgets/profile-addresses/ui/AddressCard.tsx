"use client";

import { Check, Edit3, MapPin, Trash2 } from "lucide-react";
import type { Address } from "../types";

interface AddressCardProps {
  address: Address;
  onSelectDefault: (address: Address) => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  isPending?: boolean;
}

export const AddressCard = ({
  address,
  onSelectDefault,
  onEdit,
  onDelete,
  isPending = false,
}: AddressCardProps) => {
  const detailsList: string[] = [];
  if (address.entrance) detailsList.push(`подъезд ${address.entrance}`);
  if (address.floor) detailsList.push(`этаж ${address.floor}`);
  if (address.intercom) detailsList.push(`домофон ${address.intercom}`);
  const detailsText = detailsList.join(", ");

  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
        address.isDefault
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-xs ring-1 ring-emerald-500/20"
          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left info column */}
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Default selection radio / check button */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => onSelectDefault(address)}
            aria-label={
              address.isDefault
                ? "Основной адрес доставки"
                : "Сделать этот адрес основным"
            }
            title={
              address.isDefault
                ? "Основной адрес доставки"
                : "Нажмите, чтобы сделать этот адрес основным"
            }
            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
              address.isDefault
                ? "bg-emerald-600 text-white shadow-2xs"
                : "border-2 border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50"
            }`}
          >
            <Check size={16} strokeWidth={2.8} />
          </button>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={18} className={address.isDefault ? "text-emerald-600" : "text-slate-400"} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                  {address.city}, ул. {address.street}, д. {address.house}
                  {address.apartment ? `, кв. ${address.apartment}` : ""}
                </h3>
              </div>
              {address.isDefault ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
                  <Check size={12} strokeWidth={3} />
                  Основной адрес
                </span>
              ) : null}
            </div>

            {detailsText ? (
              <div className="text-xs sm:text-sm text-slate-600 pl-6">
                {detailsText}
              </div>
            ) : null}

            {address.comment ? (
              <div className="mt-2 ml-6 rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-2 text-xs text-slate-600 inline-block max-w-full break-words">
                <span className="font-semibold text-slate-700">Курьеру: </span>
                <span>{address.comment}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right actions column */}
        <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onEdit(address)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Edit3 size={15} />
            <span>Редактировать</span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onDelete(address)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/70 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={15} />
            <span>Удалить</span>
          </button>
        </div>
      </div>
    </article>
  );
};
