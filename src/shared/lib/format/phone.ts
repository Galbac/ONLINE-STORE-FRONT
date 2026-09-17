/**
 * Очищает и приводит введенный телефон к стандарту, ожидаемому бэкендом (+7XXXXXXXXXX).
 * Убирает пробелы, скобки, тире. Если начинается с 8, заменяет на +7.
 */
export const normalizePhoneNumber = (phone: string): string => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "";
  }

  // Оставляем только цифры и плюс
  let cleaned = trimmed.replace(/[^\d+]/g, "");

  // Если начинается с 89... заменяем 8 на +7
  if (cleaned.startsWith("89") && cleaned.length === 11) {
    cleaned = "+7" + cleaned.slice(1);
  } else if (cleaned.startsWith("79") && cleaned.length === 11) {
    cleaned = "+" + cleaned;
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "+7" + cleaned;
  } else if (!cleaned.startsWith("+") && cleaned.length >= 10) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
};
