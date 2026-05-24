export interface AdminNotificationSettingsResponse {
  email_enabled: boolean;
  email_from?: string | null;
  email_sender_name: string;
  notify_admin_1c_error: boolean;
  notify_admin_new_order: boolean;
  notify_admin_payment_error: boolean;
  notify_customer_delivery: boolean;
  notify_customer_order_created: boolean;
  notify_customer_order_status: boolean;
  notify_customer_payment: boolean;
  telegram_admin_chat_id?: string | null;
  telegram_enabled: boolean;
  updated_at: string;
}

export type AdminNotificationSettingsPayloadValue = boolean | string | null;

export type AdminNotificationSettingsPayload = Record<
  string,
  AdminNotificationSettingsPayloadValue
>;

export interface AdminNotificationTestEmailPayload {
  email: string;
  message?: string | null;
  subject?: string | null;
}

export interface AdminNotificationTestTelegramPayload {
  chat_id?: string | null;
  message?: string | null;
}

export interface AdminNotificationMessageResponse {
  chat_id?: string | null;
  email?: string | null;
  message: string;
}
