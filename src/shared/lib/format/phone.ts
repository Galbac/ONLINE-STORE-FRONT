/**
 * Очищает и приводит введенный телефон к стандарту, ожидаемому бэкендом (+7XXXXXXXXXX).
 * Убирает любые нецифровые символы, скобки, пробелы и тире.
 * Корректно преобразует 8XXXXXXXXXX, 7XXXXXXXXXX, 9XXXXXXXXX в +7XXXXXXXXXX.
 */
export const normalizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) {
    return "";
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return "";
  }

  // Оставляем только цифры
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  // Стандартный российский номер: 11 цифр (начинается с 7 или 8)
  if (digits.length === 11) {
    if (digits.startsWith("7") || digits.startsWith("8")) {
      return `+7${digits.slice(1)}`;
    }
    return `+${digits}`;
  }

  // 10 цифр (без кода страны, например 9285191485)
  if (digits.length === 10) {
    return `+7${digits}`;
  }

  // Иные международные номера
  return `+${digits}`;
};

/**
 * Применяет маску +7 (XXX) XXX-XX-XX к вводимой строке.
 */
export const formatPhoneMask = (input: string | null | undefined): string => {
  if (!input) {
    return "";
  }

  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  // Если номер начинается с 7 или 8, отбрасываем первую цифру, чтобы форматировать как +7 (...)
  let localDigits = digits;
  if (digits.startsWith("7") || digits.startsWith("8")) {
    localDigits = digits.slice(1);
  }

  // Ограничиваем 10 цифрами после кода страны (+7)
  localDigits = localDigits.slice(0, 10);

  let formatted = "+7";
  if (localDigits.length > 0) {
    formatted += ` (${localDigits.slice(0, 3)}`;
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

/**
 * Умный обработчик изменения значения в поле ввода телефона.
 * - При вводе цифры 7, 8 или 9 сразу подставляет красивое начало +7 (X
 * - При удалении разделителей (скобки, дефисы) клавишей Backspace удаляет предшествующую цифру
 * - При очистке до кода страны (+7 или +7 () очищает поле в пустую строку
 * - При вставке любого номера форматирует по маске
 */
export const handlePhoneInputChange = (raw: string, currentValue: string = ""): string => {
  let cleaned = raw;
  const rawDigits = raw.replace(/\D/g, "");
  const currentDigits = currentValue.replace(/\D/g, "");

  // Если нажали Backspace и удалили символ разметки (количество цифр не изменилось)
  if (raw.length < currentValue.length && rawDigits.length === currentDigits.length && rawDigits.length > 0) {
    const lastDigitIndex = cleaned.search(/\d(?=[^\d]*$)/);
    if (lastDigitIndex !== -1) {
      cleaned = cleaned.slice(0, lastDigitIndex) + cleaned.slice(lastDigitIndex + 1);
    }
  }

  const digits = cleaned.replace(/\D/g, "");

  // Если пользователь удалил символы и остались только цифры кода страны (7 или 8)
  if (raw.length < currentValue.length && (digits === "7" || digits === "8" || digits === "")) {
    return "";
  }

  // Если пользователь только начал ввод с одной цифры 7, 8 или знака +
  if ((raw === "7" || raw === "8" || raw === "+7" || raw === "+") && !currentValue) {
    return "+7 (";
  }

  if (!digits) {
    return "";
  }

  // Если осталась только 7 или 8 при короткой строке
  if ((digits === "7" || digits === "8") && cleaned.length <= 4) {
    return "";
  }

  return formatPhoneMask(cleaned);
};

/**
 * Проверяет, заполнен ли российский номер телефона полностью (11 цифр).
 */
export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone) {
    return false;
  }
  const normalized = normalizePhoneNumber(phone);
  return normalized.startsWith("+7") && normalized.length === 12; // "+7" + 10 цифр
};
