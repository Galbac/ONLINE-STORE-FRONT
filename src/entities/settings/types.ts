import type { DayScheduleItem } from "@/entities/admin-settings";

export interface PublicStoreSettingsResponse {
  shop_name: string;
  legal_name?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  working_hours?: string | null;
  schedule?: DayScheduleItem[] | null;
  is_open_now?: boolean;
  current_status_text?: string | null;
  online_payment_enabled: boolean;
  pay_on_delivery_enabled: boolean;
  maintenance_mode: boolean;
  promo_codes_enabled: boolean;
  referral_program_enabled: boolean;
  loyalty_program_enabled: boolean;
  privacy_policy_url?: string | null;
  user_agreement_url?: string | null;
  personal_data_consent_url?: string | null;
}
