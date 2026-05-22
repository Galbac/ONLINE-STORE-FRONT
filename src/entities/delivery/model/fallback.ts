import type {
  DeliveryCalculateResponse,
  DeliveryOptionsResponse,
  DeliveryTimeSlotsResponse,
  PickupPointListResponse,
} from "../types";

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

export const fallbackDeliveryCalculate: DeliveryCalculateResponse = {
  available: true,
  delivery_price: "149",
  free_delivery_from: "1000",
  amount_left_for_free_delivery: "351",
  min_order_amount: "500",
  zone: {
    id: 1,
    name: "Москва и область",
  },
  message: "Доставка доступна",
};

export const fallbackPickupPoints: PickupPointListResponse = {
  items: [
    {
      id: 1,
      name: "СуперМаркет на Примерной",
      city: "Москва",
      address: "ул. Примерная, д. 123",
      working_hours: "09:00-22:00",
      phone: "8 (800) 555-55-55",
      is_active: true,
      latitude: null,
      longitude: null,
    },
  ],
  total: 1,
  limit: 50,
  offset: 0,
};

export const fallbackDeliveryTimeSlots: DeliveryTimeSlotsResponse = {
  date: "2026-05-22",
  delivery_type: "delivery",
  items: [
    {
      id: 1,
      start_time: "10:00",
      end_time: "12:00",
      label: "10:00 - 12:00",
      available: true,
    },
    {
      id: 2,
      start_time: "12:00",
      end_time: "14:00",
      label: "12:00 - 14:00",
      available: true,
    },
    {
      id: 3,
      start_time: "14:00",
      end_time: "16:00",
      label: "14:00 - 16:00",
      available: true,
    },
    {
      id: 4,
      start_time: "16:00",
      end_time: "18:00",
      label: "16:00 - 18:00",
      available: true,
    },
    {
      id: 5,
      start_time: "18:00",
      end_time: "20:00",
      label: "18:00 - 20:00",
      available: true,
    },
    {
      id: 6,
      start_time: "20:00",
      end_time: "22:00",
      label: "20:00 - 22:00",
      available: true,
    },
  ],
};
