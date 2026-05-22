import type { OrderDetailResponse, OrderStatusResponse } from "../types";

export const fallbackOrderDetail: OrderDetailResponse = {
  id: 12345,
  order_number: "2026-05-22-12345",
  status: "processing",
  payment_method: "online",
  payment_status: "paid",
  delivery_type: "delivery",
  customer_name: "Иван Иванов",
  customer_phone: "+7 (916) 123-45-67",
  customer_email: "ivan.ivanov@mail.ru",
  address: {
    id: 1,
    city: "Москва",
    street: "Примерная",
    house: "123",
    apartment: "45",
    comment: "Подъезд 2, этаж 5, домофон 123",
  },
  pickup_point: null,
  payment: {
    id: 1,
    amount: "556.30",
    status: "paid",
    payment_url: null,
  },
  items: [],
  subtotal: "536",
  discount_amount: "75",
  promo_discount_amount: "53.70",
  delivery_price: "149",
  final_price: "556.30",
  comment: null,
  created_at: "2026-05-22T10:00:00Z",
  updated_at: "2026-05-22T10:00:00Z",
};

export const fallbackOrderStatus: OrderStatusResponse = {
  id: fallbackOrderDetail.id,
  order_number: fallbackOrderDetail.order_number,
  status: fallbackOrderDetail.status,
  status_label: "В обработке",
  payment_status: fallbackOrderDetail.payment_status ?? null,
  payment_status_label: "Оплачен",
  delivery_type: fallbackOrderDetail.delivery_type,
  next_action: null,
  updated_at: fallbackOrderDetail.updated_at,
};
