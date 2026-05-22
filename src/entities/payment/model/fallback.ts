import type { PaymentDetailResponse } from "../types";

export const fallbackPaymentDetail: PaymentDetailResponse = {
  id: 1,
  order_id: 12345,
  order_number: "2026-05-22-12345",
  amount: "659",
  currency: "RUB",
  status: "paid",
  provider: "online",
  payment_url: null,
  paid_at: "2026-05-22T10:00:00Z",
  created_at: "2026-05-22T10:00:00Z",
  updated_at: "2026-05-22T10:00:00Z",
};
