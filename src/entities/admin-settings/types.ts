export interface DayScheduleItem {
  day: number;
  day_name: string;
  is_day_off: boolean;
  open_time: string | null;
  close_time: string | null;
}

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
  privacy_policy_url?: string | null;
  user_agreement_url?: string | null;
  personal_data_consent_url?: string | null;
  updated_at?: string | null;
  working_hours?: string | null;
  schedule?: DayScheduleItem[] | null;
  is_open_now?: boolean;
  current_status_text?: string | null;
}

export type AdminSettingsPayloadValue = boolean | number | string | DayScheduleItem[] | null;

export type AdminSettingsPayload = Record<string, AdminSettingsPayloadValue>;
