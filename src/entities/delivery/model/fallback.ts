import type { DeliveryOptionsResponse } from "../types";

export const fallbackDeliveryOptions: DeliveryOptionsResponse = {
  delivery: {
    enabled: true,
    title: "Доставка курьером",
    description: "Привезем заказ сегодня в удобный интервал.",
    min_order_amount: "700",
    base_price: "199",
    free_from_amount: "2500",
    has_time_slots: true,
  },
  pickup: {
    enabled: true,
    title: "Самовывоз",
    description: "Заберите покупки из ближайшего магазина без очереди.",
    price: "0",
    has_pickup_points: true,
  },
};
