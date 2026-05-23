export interface AdminSettingsResponse {
  address?: string | null;
  currency: string;
  default_city?: string | null;
  delivery_enabled: boolean;
  email?: string | null;
  maintenance_mode: boolean;
  min_order_amount: string;
  online_payment_enabled: boolean;
  pay_on_delivery_enabled: boolean;
  phone?: string | null;
  pickup_enabled: boolean;
  shop_name: string;
  updated_at?: string | null;
  working_hours?: string | null;
}

export type AdminSettingsPayloadValue = boolean | number | string | null;

export type AdminSettingsPayload = Record<string, AdminSettingsPayloadValue>;
