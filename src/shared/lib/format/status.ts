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
  succeeded: "Оплачен",
  cancelled: "Отменён",
  canceled: "Отменён",
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
  courier: "Доставка курьером",
  pickup: "Самовывоз",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  online: "Онлайн картой",
  card: "Банковская карта",
  cash: "Наличными",
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

export const formatDeliveryType = (type: string | null | undefined): string => {
  if (!type) return "-";
  return DELIVERY_TYPE_LABELS[type] || type;
};

export const formatPaymentMethod = (method: string | null | undefined): string => {
  if (!method) return "-";
  return PAYMENT_METHOD_LABELS[method] || method;
};

export const formatDiscountType = (type: string | null | undefined): string => {
  if (!type) return "-";
  if (type === "percent") return "Процент (%)";
  if (type === "fixed_amount" || type === "fixed") return "Фиксированная сумма (₽)";
  return type;
};

export const formatProductType = (type: string | null | undefined): string => {
  if (!type) return "-";
  if (type === "weight") return "Весовой товар";
  if (type === "piece") return "Штучный товар";
  return type;
};
