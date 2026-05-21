import type { CartResponse } from "../types";

export const fallbackCart: CartResponse = {
  id: 0,
  items: [],
  items_count: 0,
  total_quantity: "0",
  subtotal: "0",
  discount_amount: "0",
  promo_discount_amount: "0",
  delivery_price: null,
  final_price: "0",
  warnings: [],
};
