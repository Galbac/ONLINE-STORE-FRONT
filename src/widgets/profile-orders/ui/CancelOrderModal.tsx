"use client";

import { createPortal } from "react-dom";

import { AlertTriangle, Loader2, X } from "lucide-react";

interface CancelOrderModalProps {
  orderNumber: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelOrderModal = ({
  orderNumber,
  isPending,
  onClose,
  onConfirm,
}: CancelOrderModalProps) => typeof document === "undefined" ? null : createPortal(
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onClick={isPending ? undefined : onClose}
  >
    <section
      aria-labelledby="cancel-order-title"
      aria-modal="true"
      className="relative max-h-[calc(100dvh-32px)] overflow-y-auto w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-7"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
    >
      <button
        aria-label="Закрыть окно"
        className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        disabled={isPending}
        onClick={onClose}
        type="button"
      >
        <X size={18} />
      </button>
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertTriangle size={24} />
      </span>
      <h2 id="cancel-order-title" className="text-lg font-bold text-slate-900">
        Отменить заказ?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Заказ №{orderNumber} будет отменён. Это действие нельзя будет отменить.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          className="h-11 rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          disabled={isPending}
          onClick={onClose}
          type="button"
        >
          Не отменять
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
          {isPending ? "Отменяем…" : "Да, отменить заказ"}
        </button>
      </div>
    </section>
  </div>
, document.body);
