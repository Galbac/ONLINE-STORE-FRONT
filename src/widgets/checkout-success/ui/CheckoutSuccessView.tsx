import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Truck,
} from "lucide-react";
import type { OrderDetailResponse, OrderStatusResponse } from "@/entities/order";
import type { PaymentDetailResponse } from "@/entities/payment";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { toPriceFormat } from "@/shared/lib/format";

interface CheckoutSuccessViewProps {
  order: OrderDetailResponse;
  payment: PaymentDetailResponse;
  status: OrderStatusResponse;
}

export const CheckoutSuccessView = ({ order, status }: CheckoutSuccessViewProps) => {
  return (
    <main className="min-h-[75vh] py-10 bg-gradient-to-b from-slate-50 to-white">
      <Container className="max-w-3xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-xl shadow-slate-900/5 text-center space-y-6">
          <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 animate-in zoom-in-95 duration-200">
            <CheckCircle2 size={44} />
          </span>

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Заказ успешно оформлен!
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Спасибо за ваш заказ. Мы уже передали его на сборку и бережно доставим продукты прямо к вашей двери.
            </p>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 text-left space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3.5">
              <span className="text-xs font-semibold text-slate-500">Номер заказа:</span>
              <span className="text-sm font-extrabold text-slate-900">№ {order.order_number}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3.5">
              <span className="text-xs font-semibold text-slate-500">Сумма к оплате:</span>
              <span className="text-base font-black text-emerald-700">{toPriceFormat(order.final_price)}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3.5">
              <span className="text-xs font-semibold text-slate-500">Способ получения:</span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Truck size={14} className="text-emerald-600" />
                {order.delivery_type === "pickup" ? "Самовывоз из магазина" : "Доставка курьером"}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">Статус оплаты:</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <Sparkles size={12} />
                {status.payment_status_label ?? "Оплачен"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/profile/orders/${order.id}`}
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 transition"
            >
              <span>Отслеживать заказ</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href={ROUTES.CATALOG}
              className="flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Продолжить покупки
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
};
