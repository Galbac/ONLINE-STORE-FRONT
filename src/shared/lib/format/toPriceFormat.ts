export const toPriceFormat = (value: string | number | null | undefined): string => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "RUB",
  }).format(Number.isFinite(amount) ? amount : 0);
};
