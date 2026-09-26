/**
 * Склонение слова "товар" для числительных русского языка
 * Примеры:
 * 1 -> "товар"
 * 2 -> "товара"
 * 5 -> "товаров"
 * 21 -> "товар"
 * 159 -> "товаров"
 */
export function getProductNoun(count: number): string {
  const absCount = Math.abs(Math.round(count));
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ["товар", "товара", "товаров"] as const;

  const index =
    absCount % 100 > 4 && absCount % 100 < 20
      ? 2
      : (cases[absCount % 10 < 5 ? absCount % 10 : 5] ?? 2);

  return titles[index] ?? "товаров";
}

/**
 * Форматирование количества товаров с числом и правильным существительным
 * 1 -> "1 товар"
 * 2 -> "2 товара"
 * 5 -> "5 товаров"
 * 21 -> "21 товар"
 * 159 -> "159 товаров"
 */
export function formatProductsCount(count: number): string {
  const noun = getProductNoun(count);
  return `${count} ${noun}`;
}

export function formatFoundProducts(count: number): string {
  const noun = getProductNoun(count);
  return `Найдено ${count} ${noun}`;
}
