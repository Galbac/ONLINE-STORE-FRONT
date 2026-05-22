import type { CartResponse, CartSummaryResponse } from "../types";

export const emptyCartResponse: CartResponse = {
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

export const emptyCartSummaryResponse: CartSummaryResponse = {
  items_count: 0,
  total_quantity: "0",
  subtotal: "0",
  discount_amount: "0",
  promo_discount_amount: "0",
  delivery_price: null,
  final_price: "0",
  has_warnings: false,
  warnings_count: 0,
  promo_code: null,
};
