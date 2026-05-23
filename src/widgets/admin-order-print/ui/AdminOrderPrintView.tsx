"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { AdminOrderDetailResponse, AdminOrderPrintResponse } from "@/entities/admin-order";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface AdminOrderPrintViewProps {
  orderId: number;
  printData: AdminOrderPrintResponse;
}

export const AdminOrderPrintView = ({ orderId, printData }: AdminOrderPrintViewProps) => {
  const html = getHtml(printData);
  const order = getOrder(printData);

  return (
    <div className="bg-bg-secondary text-text-primary -m-4 min-h-screen p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
            href={ROUTES.ADMIN_ORDER(orderId)}
          >
            <ArrowLeft size={16} />К заказу
          </Link>
          <button
            className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition"
            onClick={() => window.print()}
            type="button"
          >
            <Printer size={17} />
            Печать
          </button>
        </div>

        {html ? (
          <iframe
            className="border-border h-[calc(100vh-120px)] w-full rounded-lg border bg-white print:h-screen print:border-0"
            sandbox=""
            srcDoc={html}
            title="Печатная форма заказа"
          />
        ) : order ? (
          <PrintableOrder order={order} />
        ) : (
          <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-6">
            <h1 className="text-2xl font-bold">Печатная версия заказа</h1>
            <p className="text-text-secondary mt-3">
              Backend вернул печатную форму в формате, который не содержит полей заказа или HTML.
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

const PrintableOrder = ({ order }: { order: AdminOrderDetailResponse }) => {
  return (
    <article className="shadow-soft bg-white p-6 text-black sm:p-10 print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-300 pb-6">
        <div>
          <p className="text-sm text-neutral-500">Печатная форма заказа</p>
          <h1 className="mt-2 text-3xl font-bold">{order.order_number}</h1>
          <p className="mt-2 text-sm text-neutral-600">Создан {formatDate(order.created_at)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">Статус: {order.status}</p>
          <p className="mt-1 text-neutral-600">Оплата: {order.payment_status ?? "-"}</p>
        </div>
      </header>

      <section className="grid gap-6 border-b border-neutral-300 py-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold">Клиент</h2>
          <div className="mt-3 space-y-2 text-sm">
            <PrintRow label="Имя" value={order.customer.name} />
            <PrintRow label="Телефон" value={order.customer.phone} />
            <PrintRow label="Email" value={order.customer.email ?? "-"} />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold">Получение</h2>
          <div className="mt-3 space-y-2 text-sm">
            <PrintRow label="Тип" value={order.delivery_type} />
            <PrintRow label="Адрес" value={formatDeliveryAddress(order)} />
            <PrintRow label="Самовывоз" value={formatPickupPoint(order)} />
          </div>
        </div>
      </section>

      <section className="py-6">
        <h2 className="text-lg font-bold">Товары</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-neutral-300 bg-neutral-100">
                <TableHeader>Товар</TableHeader>
                <TableHeader>Количество</TableHeader>
                <TableHeader>Цена</TableHeader>
                <TableHeader>Итого</TableHeader>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr className="border-b border-neutral-200" key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>
                    {formatQuantity(item.quantity)} {item.unit}
                  </TableCell>
                  <TableCell>{toPriceFormat(item.price)}</TableCell>
                  <TableCell>{toPriceFormat(item.final_price)}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 border-t border-neutral-300 pt-6 md:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-bold">Комментарии</h2>
          <p className="mt-3 min-h-16 rounded border border-neutral-300 p-3 text-sm">
            {order.comment ?? "-"}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <PrintRow label="Товары" value={toPriceFormat(order.subtotal)} />
          <PrintRow label="Скидка" value={toPriceFormat(order.discount_amount)} />
          <PrintRow label="Промокод" value={toPriceFormat(order.promo_discount_amount)} />
          <PrintRow label="Доставка" value={toPriceFormat(order.delivery_price)} />
          <div className="mt-3 border-t border-neutral-300 pt-3">
            <PrintRow label="Итого" value={toPriceFormat(order.final_price)} strong />
          </div>
        </div>
      </section>
    </article>
  );
};

const PrintRow = ({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className={strong ? "text-right text-lg font-bold" : "text-right font-medium"}>
        {value}
      </span>
    </div>
  );
};

const TableHeader = ({ children }: { children: React.ReactNode }) => {
  return <th className="px-3 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: React.ReactNode }) => {
  return <td className="px-3 py-3">{children}</td>;
};

const getHtml = (data: AdminOrderPrintResponse): string | null => {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (isRecord(data) && typeof data.html === "string" && data.html.trim()) {
    return data.html;
  }

  return null;
};

const getOrder = (data: AdminOrderPrintResponse): AdminOrderDetailResponse | null => {
  if (isRecord(data) && isOrderDetail(data.order)) {
    return data.order;
  }

  if (isOrderDetail(data)) {
    return data;
  }

  return null;
};

const isOrderDetail = (value: unknown): value is AdminOrderDetailResponse => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.order_number === "string" &&
    isRecord(value.customer) &&
    Array.isArray(value.items) &&
    typeof value.final_price === "string"
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

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

const formatQuantity = (value: string): string => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3,
  }).format(amount);
};

const formatDeliveryAddress = (order: AdminOrderDetailResponse): string => {
  if (!order.address) {
    return "-";
  }

  return [
    order.address.city,
    order.address.street,
    order.address.house,
    order.address.apartment ? `кв. ${order.address.apartment}` : null,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatPickupPoint = (order: AdminOrderDetailResponse): string => {
  if (!order.pickup_point) {
    return "-";
  }

  return `${order.pickup_point.name}, ${order.pickup_point.city}, ${order.pickup_point.address}`;
};
