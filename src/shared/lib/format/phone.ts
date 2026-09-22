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


/**
 * Применяет маску +7 (XXX) XXX-XX-XX к вводимой строке.
 */
export const formatPhoneMask = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  // Если номер начинается с 7 или 8, отбрасываем первую цифру, чтобы форматировать как +7 (...)
  let localDigits = digits;
  if (digits.startsWith("7") || digits.startsWith("8")) {
    localDigits = digits.slice(1);
  }

  // Ограничиваем 10 цифрами после кода страны
  localDigits = localDigits.slice(0, 10);

  let formatted = "+7";
  if (localDigits.length > 0) {
    formatted += " (" + localDigits.slice(0, 3);
  }
  if (localDigits.length >= 3) {
    formatted += ") ";
  }
  if (localDigits.length > 3) {
    formatted += localDigits.slice(3, 6);
  }
  if (localDigits.length >= 6) {
    formatted += "-";
  }
  if (localDigits.length > 6) {
    formatted += localDigits.slice(6, 8);
  }
  if (localDigits.length >= 8) {
    formatted += "-";
  }
  if (localDigits.length > 8) {
    formatted += localDigits.slice(8, 10);
  }

  return formatted;
};
