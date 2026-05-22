import Link from "next/link";
import {
  BadgeCheck,
  ClipboardCheck,
  Copy,
  CreditCard,
  Headphones,
  MapPin,
  PackageCheck,
  Percent,
  Truck,
} from "lucide-react";
import type { OrderDetailResponse, OrderStatusResponse } from "@/entities/order";
import type { PaymentDetailResponse } from "@/entities/payment";
import { cn, ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";

interface CheckoutSuccessViewProps {
  order: OrderDetailResponse;
  payment: PaymentDetailResponse;
  status: OrderStatusResponse;
}

export const CheckoutSuccessView = ({ order, payment, status }: CheckoutSuccessViewProps) => {
  const paymentStatusLabel = status.payment_status_label ?? getPaymentStatusLabel(payment.status);
  const deliveryTitle = getDeliveryTitle(order.delivery_type);
  const deliveryDetails = getDeliveryDetails(order);
  const orderDetailsHref = `/profile/orders/${order.id}`;

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-6 flex items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <span>Заказ оформлен</span>
        </nav>

        <section className="mx-auto max-w-4xl text-center">
          <span className="bg-bg-hover text-accent-primary mx-auto grid size-28 place-items-center rounded-full">
            <BadgeCheck size={62} />
          </span>
          <h1 className="text-text-primary mt-7 text-4xl font-bold md:text-5xl">Заказ оформлен!</h1>
          <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg">
            Спасибо за покупку. Мы начали обработку вашего заказа.
          </p>
        </section>

        <section className="border-border mx-auto mt-9 max-w-4xl rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.08)] md:p-9">
          <div className="space-y-8">
            <SuccessInfoRow
              icon={<ClipboardCheck size={34} />}
              title="Номер заказа"
              value={`№ ${order.order_number}`}
              action={
                <button
                  className="border-border text-text-secondary hover:text-accent-primary grid size-12 place-items-center rounded-lg border transition"
                  type="button"
                  aria-label="Скопировать номер заказа"
                >
                  <Copy size={22} />
                </button>
              }
            />
            <SuccessInfoRow
              icon={<CreditCard size={34} />}
              title="Статус оплаты"
              value={paymentStatusLabel}
              badge={paymentStatusLabel}
              text={getPaymentText(payment.status)}
            />
            <SuccessInfoRow
              icon={<Truck size={34} />}
              title="Способ получения"
              value={deliveryTitle}
              text={getDeliverySlotText(order)}
            />
            <SuccessInfoRow
              icon={<MapPin size={34} />}
              title={order.delivery_type === "pickup" ? "Точка самовывоза" : "Адрес доставки"}
              value={deliveryDetails.title}
              text={deliveryDetails.text}
            />
          </div>

          <div className="bg-bg-hover mt-9 rounded-lg border border-green-100 p-5 text-center">
            <p className="text-text-secondary">
              Детали заказа и его статус доступны на{" "}
              <Link className="text-accent-primary font-semibold" href={orderDetailsHref}>
                странице заказа
              </Link>
              .
            </p>
            <Link
              className="border-accent-primary text-accent-primary hover:bg-bg-primary mt-4 inline-flex h-14 w-full max-w-md items-center justify-center gap-3 rounded-lg border px-6 text-base font-bold transition"
              href={orderDetailsHref}
            >
              Перейти к деталям заказа
              <span aria-hidden>›</span>
            </Link>
          </div>

          <Link
            className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-5 inline-flex h-14 w-full items-center justify-center rounded-lg px-6 text-base font-bold transition"
            href={ROUTES.CATALOG}
          >
            Вернуться в каталог
          </Link>
        </section>

        <SuccessBenefits />
      </Container>
    </main>
  );
};

interface SuccessInfoRowProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  action?: React.ReactNode;
  badge?: string;
  text?: string;
}

const SuccessInfoRow = ({ action, badge, icon, text, title, value }: SuccessInfoRowProps) => {
  return (
    <div className="grid gap-4 text-left md:grid-cols-[88px_minmax(0,1fr)_60px] md:items-center">
      <span className="bg-bg-hover text-accent-primary grid size-16 place-items-center rounded-full">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-text-secondary text-sm">{title}</p>
        {badge ? (
          <span
            className={cn(
              "mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold",
              badge === "Оплачен" || badge === "Оплачено"
                ? "bg-green-100 text-green-700"
                : "bg-bg-secondary text-text-primary",
            )}
          >
            {badge}
          </span>
        ) : (
          <p className="text-text-primary mt-2 text-2xl font-bold">{value}</p>
        )}
        {text ? <p className="text-text-primary mt-3">{text}</p> : null}
      </div>
      {action ? <div className="md:justify-self-end">{action}</div> : null}
    </div>
  );
};

const SuccessBenefits = () => {
  return (
    <section className="border-border mt-10 grid gap-5 rounded-lg border bg-white p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:grid-cols-4">
      <Benefit
        icon={<PackageCheck size={28} />}
        title="Качество продуктов"
        text="Только свежие товары каждый день"
      />
      <Benefit
        icon={<Truck size={28} />}
        title="Доставка"
        text="Быстрая доставка на дом и в удобное время"
      />
      <Benefit
        icon={<Percent size={28} />}
        title="Выгодные цены"
        text="Лучшие предложения и акции для вас"
      />
      <Benefit
        icon={<Headphones size={28} />}
        title="Поддержка 24/7"
        text="Мы всегда на связи и готовы помочь"
      />
    </section>
  );
};

interface BenefitProps {
  icon: React.ReactNode;
  text: string;
  title: string;
}

const Benefit = ({ icon, text, title }: BenefitProps) => {
  return (
    <div className="flex items-start gap-4">
      <span className="bg-bg-hover text-accent-primary grid size-12 shrink-0 place-items-center rounded-full">
        {icon}
      </span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-text-secondary mt-2 text-sm leading-6">{text}</p>
      </div>
    </div>
  );
};

const getPaymentStatusLabel = (status: string): string => {
  if (status === "paid" || status === "succeeded") {
    return "Оплачен";
  }

  if (status === "pending") {
    return "Ожидает оплаты";
  }

  return "В обработке";
};

const getPaymentText = (status: string): string => {
  if (status === "paid" || status === "succeeded") {
    return "Оплата прошла успешно.";
  }

  return "Платеж будет обновлен после подтверждения.";
};

const getDeliveryTitle = (deliveryType: string): string => {
  return deliveryType === "pickup" ? "Самовывоз" : "Доставка курьером";
};

const getDeliverySlotText = (order: OrderDetailResponse): string => {
  const date = formatDate(order.created_at);

  return order.delivery_type === "pickup"
    ? `${date}, заказ будет ждать в выбранной точке`
    : `${date} с 10:00 до 12:00`;
};

const getDeliveryDetails = (order: OrderDetailResponse): { title: string; text: string } => {
  if (order.delivery_type === "pickup" && order.pickup_point) {
    return {
      title: order.pickup_point.name,
      text: "Заберите заказ в часы работы магазина.",
    };
  }

  if (order.address) {
    const apartment = order.address.apartment ? `, кв. ${order.address.apartment}` : "";

    return {
      title: `${order.address.city}, ул. ${order.address.street}, д. ${order.address.house}${apartment}`,
      text: order.address.comment ?? "Курьер позвонит перед приездом.",
    };
  }

  return {
    title: "Адрес уточняется",
    text: "Мы свяжемся с вами для подтверждения деталей.",
  };
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Ближайшая дата";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};
