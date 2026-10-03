export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Ожидает оплаты",
  created: "Создан",
  new: "Новый",
  confirmed: "Подтверждён",
  awaiting_confirmation: "Ожидает подтверждения",
  paid: "Оплачен",
  assembling: "Собирается",
  assembled: "Собран",
  ready_for_pickup: "Готов к выдаче",
  delivering: "Доставляется",
  in_delivery: "В пути",
  in_transit: "В пути",
  on_the_way: "В пути",
  delivered: "Доставлен",
  completed: "Выполнен",
  cancelled: "Отменён",
  canceled: "Отменён",
  rejected: "Отклонён",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Не оплачен",
  pending: "Ожидает оплаты",
  pending_payment: "Ожидает оплаты",
  processing: "В обработке",
  authorized: "Авторизован",
  paid: "Оплачен",
  succeeded: "Оплачен",
  success: "Оплачен",
  cancelled: "Отменён",
  canceled: "Отменён",
  refunded: "Возвращён",
  partial_refunded: "Частичный возврат",
  refund_pending: "Возврат в обработке",
  failed: "Ошибка оплаты",
};

export const SYNC_STATUS_LABELS: Record<string, string> = {
  synced: "Синхронизирован",
  pending: "В очереди",
  processing: "В процессе",
  in_progress: "В процессе",
  error: "Ошибка",
  failed: "Ошибка",
  not_synced: "Не синхронизирован",
  none: "Не требуется",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  customer: "Клиент",
  user: "Клиент",
  manager: "Менеджер",
  admin: "Администратор",
  courier: "Курьер",
  picker: "Комплектовщик",
  staff: "Сотрудник",
};

export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  delivery: "Доставка курьером",
  courier: "Доставка курьером",
  pickup: "Самовывоз",
  express: "Экспресс-доставка",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  online: "Онлайн картой",
  card: "Банковская карта",
  cash: "Наличными",
  sbp: "СБП (в 1 клик)",
  on_delivery: "При получении",
  card_courier: "Картой курьеру",
  cash_courier: "Наличными курьеру",
};

export const UNIT_LABELS: Record<string, string> = {
  piece: "шт",
  pcs: "шт",
  item: "шт",
  kg: "кг",
  kilo: "кг",
  gram: "г",
  g: "г",
  liter: "л",
  l: "л",
  ml: "мл",
  pack: "уп",
  упак: "уп",
  шт: "шт",
  кг: "кг",
  г: "г",
  л: "л",
  мл: "мл",
};

export const formatOrderStatus = (status: string | null | undefined): string => {
  if (!status) return "—";
  const normalized = status.trim().toLowerCase();
  return ORDER_STATUS_LABELS[normalized] || status;
};

export const formatPaymentStatus = (status: string | null | undefined): string => {
  if (!status) return "—";
  const normalized = status.trim().toLowerCase();
  return PAYMENT_STATUS_LABELS[normalized] || status;
};

export const formatSyncStatus = (status: string | null | undefined): string => {
  if (!status) return "—";
  const normalized = status.trim().toLowerCase();
  return SYNC_STATUS_LABELS[normalized] || status;
};

export const formatUserRole = (role: string | null | undefined): string => {
  if (!role) return "—";
  const normalized = role.trim().toLowerCase();
  return USER_ROLE_LABELS[normalized] || role;
};

export const formatDeliveryType = (type: string | null | undefined): string => {
  if (!type) return "—";
  const normalized = type.trim().toLowerCase();
  return DELIVERY_TYPE_LABELS[normalized] || type;
};

export const formatPaymentMethod = (method: string | null | undefined): string => {
  if (!method) return "—";
  const normalized = method.trim().toLowerCase();
  return PAYMENT_METHOD_LABELS[normalized] || method;
};

export const formatDiscountType = (type: string | null | undefined): string => {
  if (!type) return "—";
  const normalized = type.trim().toLowerCase();
  if (normalized === "percent") return "Процент (%)";
  if (normalized === "fixed_amount" || normalized === "fixed") return "Фиксированная сумма (₽)";
  return type;
};

export const formatProductType = (type: string | null | undefined): string => {
  if (!type) return "—";
  const normalized = type.trim().toLowerCase();
  if (normalized === "weight") return "Весовой товар";
  if (normalized === "piece") return "Штучный товар";
  return type;
};

export const formatUnit = (unit: string | null | undefined): string => {
  if (!unit) return "шт";
  const normalized = unit.trim().toLowerCase();
  return UNIT_LABELS[normalized] || unit;
};
