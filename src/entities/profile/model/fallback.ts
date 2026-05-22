import type { AddressListResponse, ProfileSummaryResponse } from "../types";

export const fallbackProfileSummary: ProfileSummaryResponse = {
  user: {
    id: 1,
    name: "Иван Иванов",
    phone: "+7 (999) 123-45-67",
    email: "ivan.ivanov@example.com",
    role: "customer",
    is_active: true,
    is_verified: true,
  },
  stats: {
    orders_count: 12,
    addresses_count: 2,
  },
  default_address: {
    id: 1,
    city: "Москва",
    street: "Примерная",
    house: "123",
    apartment: "45",
  },
  active_order: {
    id: 12345,
    order_number: "2026-05-22-12345",
    status: "processing",
    payment_method: "online",
    payment_status: "paid",
    delivery_type: "delivery",
    final_price: "1245",
    items_count: 3,
    created_at: "2026-05-22T10:00:00Z",
  },
  recent_orders: [
    {
      id: 12345,
      order_number: "2026-05-22-12345",
      status: "processing",
      payment_method: "online",
      payment_status: "paid",
      delivery_type: "delivery",
      final_price: "1245",
      items_count: 3,
      created_at: "2026-05-22T10:00:00Z",
    },
    {
      id: 12312,
      order_number: "2026-05-18-12312",
      status: "delivered",
      payment_method: "online",
      payment_status: "paid",
      delivery_type: "pickup",
      final_price: "2780",
      items_count: 8,
      created_at: "2026-05-18T14:30:00Z",
    },
  ],
};

export const fallbackAddresses: AddressListResponse = {
  items: [
    {
      id: 1,
      title: "Дом",
      city: "Москва",
      street: "Примерная",
      house: "123",
      building: null,
      apartment: "45",
      entrance: null,
      floor: null,
      intercom: null,
      comment: null,
      is_default: true,
      created_at: "2026-05-22T00:00:00Z",
      updated_at: "2026-05-22T00:00:00Z",
    },
  ],
  total: 1,
  limit: 50,
  offset: 0,
};
