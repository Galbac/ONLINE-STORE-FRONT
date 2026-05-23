export interface PaymentCreateRequest {
  order_id: number;
}

export interface PaymentCreateResponse {
  id: number;
  order_id: number;
  order_number: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  payment_url: string;
  created_at: string;
}

export interface PaymentDetailResponse {
  id: number;
  order_id: number;
  order_number: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  payment_url?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfirmRequest {
  amount?: number | string | null;
}

export interface PaymentConfirmResponse {
  id: number;
  order_id: number;
  status: string;
  amount: string;
  currency: string;
  paid_at?: string | null;
}

export interface PaymentCancelRequest {
  reason?: string | null;
}

export interface PaymentCancelPaymentResponse {
  id: number;
  order_id: number;
  status: string;
  amount: string;
  currency: string;
  cancelled_at?: string | null;
}

export interface PaymentCancelResponse {
  message: string;
  payment: PaymentCancelPaymentResponse;
}

export interface PaymentRefundRequest {
  amount?: number | string | null;
  reason?: string | null;
}

export interface PaymentRefundResponse {
  message: string;
  refund: {
    id: number;
    payment_id: number;
    order_id: number;
    amount: string;
    currency: string;
    status: string;
    reason?: string | null;
    created_at: string;
  };
}
