import type { ActiveDiscountsResponse } from "../types";

export const fallbackActiveDiscounts: ActiveDiscountsResponse = {
  items: [
    {
      id: 1,
      name: "Фруктовая неделя",
      type: "category",
      discount_type: "percent",
      discount_value: "20",
      is_active: true,
    },
    {
      id: 2,
      name: "Скидки на ягоды",
      type: "product",
      discount_type: "percent",
      discount_value: "15",
      is_active: true,
    },
    {
      id: 3,
      name: "Бесплатная доставка от 2 500 ₽",
      type: "cart",
      discount_type: "fixed",
      discount_value: "0",
      is_active: true,
    },
  ],
  total: 3,
  limit: 3,
  offset: 0,
};
