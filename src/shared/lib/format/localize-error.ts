/**
 * Переводит системные ошибки валидации Pydantic / FastAPI на понятный русский язык.
 */
export const localizeErrorMessage = (msg: string | null | undefined): string => {
  if (!msg) return "Неверные данные";

  const trimmed = msg.trim();
  const lower = trimmed.toLowerCase();

  // Email validation errors
  if (
    lower.includes("value is not a valid email address") ||
    lower.includes("the part after the @-sign is not valid") ||
    lower.includes("not within a valid top-level domain")
  ) {
    return "Некорректный адрес электронной почты. Проверьте правильность домена (например, .ru или .com).";
  }

  if (lower.includes("@-sign") || lower.includes("at-sign") || lower.includes("must have an @-sign")) {
    return "Некорректный адрес электронной почты: отсутствует или неверен символ @.";
  }

  // Required fields
  if (lower.includes("field required")) {
    return "Поле обязательно для заполнения.";
  }

  // Common types
  if (lower.includes("input should be a valid integer")) {
    return "Значение должно быть целым числом.";
  }
  if (lower.includes("input should be a valid number") || lower.includes("input should be a valid decimal")) {
    return "Значение должно быть числом.";
  }
  if (lower.includes("input should be a valid boolean")) {
    return "Значение должно быть логическим (да/нет).";
  }
  if (lower.includes("input should be a valid string")) {
    return "Значение должно быть строкой.";
  }
  if (lower.includes("extra inputs are not permitted")) {
    return "Переданы непредусмотренные поля.";
  }

  return trimmed;
};
