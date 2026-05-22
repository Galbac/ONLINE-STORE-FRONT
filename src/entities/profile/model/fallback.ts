import type { AddressListResponse } from "../types";

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
