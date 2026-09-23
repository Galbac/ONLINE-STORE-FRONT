export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: "Создан",
  confirmed: "Подтверждён",
  assembling: "Собирается",
  delivering: "Доставляется",
  completed: "Выполнен",
  cancelled: "Отменён",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  cancelled: "Отменён",
  refunded: "Возвращён",
  failed: "Ошибка оплаты",
};

export const SYNC_STATUS_LABELS: Record<string, string> = {
  synced: "Синхронизирован",
  pending: "В очереди",
  error: "Ошибка",
  not_synced: "Не синхронизирован",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  customer: "Клиент",
  manager: "Менеджер",
  admin: "Администратор",
  courier: "Курьер",
  picker: "Комплектовщик",
};

export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  delivery: "Доставка курьером",
  pickup: "Самовывоз",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  online: "Онлайн картой",
  sbp: "СБП (в 1 клик)",
  on_delivery: "При получении",
};

export const formatOrderStatus = (status: string | null | undefined): string => {
  if (!status) return "-";
  return ORDER_STATUS_LABELS[status] || status;
};

export const formatPaymentStatus = (status: string | null | undefined): string => {
  if (!status) return "-";
  return PAYMENT_STATUS_LABELS[status] || status;
};

export const formatSyncStatus = (status: string | null | undefined): string => {
  if (!status) return "-";
  return SYNC_STATUS_LABELS[status] || status;
};

export const formatUserRole = (role: string | null | undefined): string => {
  if (!role) return "-";
  return USER_ROLE_LABELS[role] || role;
};
