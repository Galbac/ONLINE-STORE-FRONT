"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Heart,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Trash2,
  Truck,
} from "lucide-react";
import {
  useCartStore,
  type CartItemResponse,
  type CartResponse,
  type CartSummaryResponse,
} from "@/entities/cart";
import { apiClient } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { useIsHydrated } from "@/shared/lib/hooks";
import { Container } from "@/shared/ui";

interface CartViewProps {
  initialCart?: CartResponse;
  initialSummary?: CartSummaryResponse;
}

const quantityStepByType: Record<string, number> = {
  weight: 0.1,
  weighted: 0.1,
};

export const CartView = ({ initialCart, initialSummary }: CartViewProps) => {
  const isHydrated = useIsHydrated();
  const {
    cart,
    summary,
    freeDeliveryThreshold,
    pendingAction,
    isLoading,
    errorMessage,
    setFreeDeliveryThreshold,
    updateQuantity,
    removeItem,
    clearCart,
    applyPromoCode,
    removePromoCode,
    moveToFavorites,
    setCart,
    fetchCart,
  } = useCartStore();

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [isPending] = useTransition();

  // Populate from initial props or fetch latest cart
  useEffect(() => {
    if (initialCart && initialSummary) {
      setCart(initialCart, initialSummary);
    } else {
      void fetchCart();
    }
  }, [initialCart, initialSummary, setCart, fetchCart]);

  // Fetch delivery options threshold & promo settings
  useEffect(() => {
    apiClient
      .get<{ delivery?: { free_from_amount?: string | number | null } }>("/api/delivery/options")
      .then((res) => {
        const threshold = res.delivery?.free_from_amount
          ? Number(res.delivery.free_from_amount)
          : null;
        if (threshold && Number.isFinite(threshold) && threshold > 0) {
          setFreeDeliveryThreshold(threshold);
        }
      })
      .catch(() => {});

    apiClient
      .get<{ promo_codes_enabled?: boolean }>("/api/settings")
      .then((res) => {
        if (typeof res.promo_codes_enabled === "boolean") {
          setPromoEnabled(res.promo_codes_enabled);
        }
      })
      .catch(() => {});
  }, [setFreeDeliveryThreshold]);

  const isBusy = isLoading || isPending || pendingAction !== null;
  const hasItems = cart.items.length > 0;
  const hasAvailableItems = cart.items.some((item) => item.is_available);
  const appliedPromo = summary.promo_code ?? cart.promo_code?.code ?? null;

  if (!isHydrated) {
    return <CartSkeleton />;
  }

  const handleApplyPromo = async (e: FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim();
    if (code.length < 2) {
      setPromoMessage("Введите промокод от 2 символов");
      return;
    }
    const res = await applyPromoCode(code);
    setPromoMessage(res.message);
    if (res.success) {
      setPromoCodeInput("");
    }
  };

  const handleRemovePromo = async () => {
    const res = await removePromoCode();
    setPromoMessage(res.message);
  };

  return (
    <main className="animate-in fade-in-0 min-h-[75vh] bg-slate-50/50 py-6 duration-200 md:py-10">
      <Container>
        {/* Хлебные крошки */}
        <nav
          aria-label="Навигация"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm"
        >
          <Link className="transition-colors hover:text-emerald-700" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Корзина</span>
        </nav>

        {/* Заголовок страницы и действие очистки */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-6 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Корзина
            </h1>
            <span
              aria-live="polite"
              role="status"
              className="inline-flex items-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 sm:text-sm"
            >
              {summary.items_count} {pluralizeProducts(summary.items_count)}
            </span>
          </div>

          {hasItems && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => clearCart()}
              className="inline-flex min-h-[44px] min-w-[40px] cursor-pointer items-center gap-2 self-start px-2 py-1 text-sm font-semibold text-rose-600 transition hover:text-rose-700 active:scale-95 disabled:opacity-50 sm:self-auto"
              aria-label="Очистить корзину полностью"
            >
              <Trash2 size={16} />
              <span>Очистить корзину</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-xs">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {hasItems ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
            {/* Левая колонка: Прогресс-бар + Список товаров + Промокод */}
            <div className="min-w-0 space-y-6">
              {/* Прогресс-бар бесплатной доставки */}
              <FreeDeliveryProgressBar
                finalPrice={Number(summary.final_price || cart.final_price || 0)}
                threshold={freeDeliveryThreshold}
              />

              {/* Список позиций корзины */}
              <section aria-label="Товары в корзине" className="space-y-4">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isBusy={isBusy}
                    pendingAction={pendingAction}
                    onQuantityChange={(qty) => updateQuantity(item.id, qty, item)}
                    onRemove={() => removeItem(item.id, item.name)}
                    onMoveToFavorites={() => moveToFavorites(item)}
                  />
                ))}
              </section>

              {/* Предупреждения по товарам (если есть) */}
              {cart.warnings && cart.warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-900">
                    <AlertCircle size={16} className="text-amber-600" />
                    Ограничения по заказу:
                  </p>
                  <ul className="space-y-1.5 text-xs text-amber-800 sm:text-sm">
                    {cart.warnings.map((w) => (
                      <li key={w.product_id}>• {w.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Блок промокода */}
              {promoEnabled && (
                <section
                  aria-labelledby="promo-heading"
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                >
                  <h2 id="promo-heading" className="mb-3 text-base font-bold text-slate-900">
                    Промокод на скидку
                  </h2>

                  {appliedPromo ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <Check size={16} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-emerald-950">
                            Промокод{" "}
                            <span className="font-mono font-extrabold">«{appliedPromo}»</span>{" "}
                            применён
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            Скидка учтена в итоговой стоимости
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={handleRemovePromo}
                        className="inline-flex min-h-[44px] min-w-[40px] cursor-pointer items-center justify-center px-2 text-xs font-semibold text-rose-600 transition hover:text-rose-700 hover:underline"
                        aria-label="Удалить применённый промокод"
                      >
                        Удалить
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex flex-col gap-2.5 sm:flex-row">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="Введите промокод"
                          disabled={isBusy}
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold tracking-wider uppercase transition-colors placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                          aria-label="Код промокода"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isBusy || !promoCodeInput.trim()}
                        className="inline-flex min-h-[44px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                      >
                        Применить
                      </button>
                    </form>
                  )}

                  {promoMessage && !appliedPromo && (
                    <p className="mt-2.5 text-xs font-medium text-slate-500">{promoMessage}</p>
                  )}
                </section>
              )}
            </div>

            {/* Правая колонка: Sticky Order Summary */}
            <aside className="space-y-4 xl:sticky xl:top-6">
              <OrderSummaryCard
                summary={summary}
                isBusy={isBusy || !hasAvailableItems}
                freeDeliveryThreshold={freeDeliveryThreshold}
              />
              <div className="hidden xl:block">
                <BenefitsPanel />
              </div>
            </aside>

            {/* Мобильная плавающая плашка оформления заказа */}
            <div className="fixed right-0 bottom-[calc(56px+var(--sab,0px))] left-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/80 xl:hidden">
              <div className="min-w-0">
                <p className="text-[11px] leading-tight font-medium text-slate-500">К оплате:</p>
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="truncate text-xl leading-tight font-black text-slate-900"
                >
                  {toPriceFormat(summary.final_price)}
                </p>
              </div>
              <Link
                href={ROUTES.CHECKOUT}
                className={cn(
                  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-700 active:scale-95",
                  (isBusy || !hasAvailableItems) && "pointer-events-none opacity-50",
                )}
                aria-disabled={isBusy || !hasAvailableItems}
                tabIndex={isBusy || !hasAvailableItems ? -1 : undefined}
                aria-label="Перейти к оформлению заказа"
              >
                <span>{hasAvailableItems ? "Оформить заказ" : "Нет в наличии"}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          /* Пустое состояние корзины со ссылками на категории */
          <EmptyCartState />
        )}
      </Container>
    </main>
  );
};

interface CartItemCardProps {
  item: CartItemResponse;
  isBusy: boolean;
  pendingAction: string | null;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
  onMoveToFavorites: () => void;
}

const CartItemCard = ({
  isBusy,
  item,
  onMoveToFavorites,
  onQuantityChange,
  onRemove,
  pendingAction,
}: CartItemCardProps) => {
  const quantity = Number(item.quantity) || 1;
  const rawStep = item.quantity_step ? Number(item.quantity_step) : null;
  const step =
    rawStep && Number.isFinite(rawStep) && rawStep > 0
      ? rawStep
      : (quantityStepByType[item.product_type ?? ""] ?? 1);

  const isCurrentBusy =
    pendingAction === "quantity-" + item.id ||
    pendingAction === "delete-" + item.id ||
    pendingAction === "fav-" + item.id;

  const handleMinus = () => {
    const next = roundQty(quantity - step);
    onQuantityChange(next);
  };

  const handlePlus = () => {
    const next = roundQty(quantity + step);
    onQuantityChange(next);
  };

  return (
    <article
      className={cn(
        "group relative rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs transition-all hover:border-emerald-500/30 hover:shadow-md sm:p-4",
        isCurrentBusy && "opacity-70",
      )}
    >
      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 sm:flex sm:items-center sm:gap-4">
        {/* Изображение товара */}
        <Link
          href={item.slug ? ROUTES.PRODUCT(item.slug) : ROUTES.CATALOG}
          className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 shadow-2xs sm:size-24"
        >
          {item.preview_image_url ? (
            <Image
              src={item.preview_image_url}
              alt={item.name}
              fill
              unoptimized
              sizes="112px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ShoppingBag className="size-10 text-emerald-600/70" />
          )}
        </Link>

        {/* Название, цена за единицу и наличие */}
        <div className="min-w-0 flex-1">
          <Link
            href={item.slug ? ROUTES.PRODUCT(item.slug) : ROUTES.CATALOG}
            className="line-clamp-2 text-sm leading-snug font-bold text-slate-900 transition hover:text-emerald-700 sm:text-base"
          >
            {item.name}
          </Link>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-600 sm:text-sm">
              {toPriceFormat(item.price)}
              <span className="ml-1 font-normal text-slate-400">/ {item.unit}</span>
            </span>

            {item.old_price && (
              <span className="text-xs text-slate-400 line-through">
                {toPriceFormat(item.old_price)}
              </span>
            )}
          </div>

          {item.stock_warning && (
            <p className="mt-1 text-xs font-semibold text-amber-600">{item.stock_warning}</p>
          )}
        </div>

        {/* Правый блок: Степпер + Сумма позиции + Кнопки действий */}
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:justify-end sm:gap-4 sm:border-0 sm:pt-0">
          {/* Степпер количества с доступными кнопками min-h-[44px] */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-1 shadow-inner">
            <button
              type="button"
              disabled={isBusy || !item.is_available}
              onClick={handleMinus}
              className="flex min-h-[44px] min-w-[40px] cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 active:scale-90 disabled:opacity-40"
              aria-label={"Уменьшить количество " + item.name}
            >
              <Minus size={15} />
            </button>

            <span
              aria-live="polite"
              role="status"
              className="min-w-[44px] px-1 text-center text-sm font-black whitespace-nowrap text-slate-900"
            >
              {formatQty(quantity)}
              {item.unit ? ` ${item.unit}` : ""}
            </span>

            <button
              type="button"
              disabled={
                isBusy || !item.is_available || quantity + step > Number(item.stock_quantity)
              }
              onClick={handlePlus}
              className="flex min-h-[44px] min-w-[40px] cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 active:scale-90 disabled:opacity-40"
              aria-label={"Увеличить количество " + item.name}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Итоговая цена позиции */}
          <div className="min-w-0 flex-1 text-right sm:flex-none">
            <p
              aria-live="polite"
              className="text-lg font-black tracking-tight text-slate-900 sm:text-xl"
            >
              {item.is_available ? toPriceFormat(item.final_price) : "Не в сумме"}
            </p>
          </div>

          {/* Кнопки: «В избранное» и «Удалить» — min-h-[44px] min-w-[40px] */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isBusy}
              onClick={onMoveToFavorites}
              className="flex min-h-[44px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
              aria-label={"Переместить " + item.name + " в избранное"}
              title="В избранное"
            >
              <Heart size={18} />
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={onRemove}
              className="flex min-h-[44px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-90"
              aria-label={"Удалить " + item.name + " из корзины"}
              title="Удалить"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const FreeDeliveryProgressBar = ({
  finalPrice,
  threshold,
}: {
  finalPrice: number;
  threshold: number;
}) => {
  const currentTotal = finalPrice;
  const remaining = Math.max(0, threshold - currentTotal);
  const percent = Math.min(100, Math.max(0, Math.round((currentTotal / threshold) * 100)));

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-4 shadow-xs">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <Sparkles size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-emerald-950">
            Поздравляем! У вас бесплатная доставка 🎉
          </p>
          <p className="text-xs text-emerald-700">
            Заказ превышает минимальный порог {toPriceFormat(threshold)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 p-4.5 shadow-xs">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="flex items-center gap-2 font-bold text-slate-800">
          <Truck size={17} className="shrink-0 text-emerald-600" />
          Бесплатная доставка от {toPriceFormat(threshold)}
        </span>
        <span className="font-semibold text-emerald-800">
          Добавьте еще на{" "}
          <strong className="text-sm font-black text-emerald-700">
            {toPriceFormat(remaining)}
          </strong>
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
          style={{ width: percent + "%" }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

interface OrderSummaryCardProps {
  summary: CartSummaryResponse;
  isBusy: boolean;
  freeDeliveryThreshold: number;
}

const OrderSummaryCard = ({ freeDeliveryThreshold, isBusy, summary }: OrderSummaryCardProps) => {
  const currentTotal = Number(summary.final_price || 0);
  const isFreeDelivery = currentTotal >= freeDeliveryThreshold;
  const savings = Number(summary.discount_amount || 0) + Number(summary.promo_discount_amount || 0);

  return (
    <section
      aria-label="Сводка заказа"
      className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs"
    >
      <h2 className="mb-5 text-xl font-extrabold tracking-tight text-slate-900">Ваш заказ</h2>

      <div className="space-y-3.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Товары ({summary.items_count})</span>
          <span className="font-bold text-slate-900">{toPriceFormat(summary.subtotal)}</span>
        </div>

        {Number(summary.discount_amount) > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Скидка на товары</span>
            <span className="font-bold text-emerald-600">
              -{toPriceFormat(summary.discount_amount)}
            </span>
          </div>
        )}

        {Number(summary.promo_discount_amount) > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Промокод</span>
            <span className="font-bold text-emerald-600">
              -{toPriceFormat(summary.promo_discount_amount)}
            </span>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Доставка</span>
          <span className="font-bold text-slate-900">
            {isFreeDelivery ? (
              <span className="font-extrabold text-emerald-600">Бесплатно</span>
            ) : summary.delivery_price ? (
              toPriceFormat(summary.delivery_price)
            ) : (
              "Рассчитается при адресе"
            )}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-slate-100 pt-5">
        <span className="text-base font-extrabold text-slate-900">Итого к оплате</span>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="text-3xl font-black tracking-tight text-slate-900"
        >
          {toPriceFormat(summary.final_price)}
        </span>
      </div>

      {savings > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-900">
          <span className="flex items-center gap-1.5">
            <TicketPercent size={16} className="text-emerald-700" />
            Ваша экономия:
          </span>
          <span className="text-sm font-black text-emerald-700">{toPriceFormat(savings)}</span>
        </div>
      )}

      {/* Большая кнопка оформления заказа min-h-[52px] */}
      <Link
        href={ROUTES.CHECKOUT}
        className={cn(
          "mt-6 hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-base font-extrabold text-white shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] hover:bg-emerald-700 active:scale-[0.98] xl:flex",
          isBusy && "pointer-events-none opacity-50",
        )}
      >
        <span>Перейти к оформлению</span>
        <ArrowRight size={18} />
      </Link>
    </section>
  );
};

const EmptyCartState = () => {
  return (
    <section
      aria-label="Пустая корзина"
      className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs md:p-14"
    >
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-inner ring-8 ring-emerald-50/50">
        <ShoppingBag size={40} className="stroke-[1.8]" />
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        В вашей корзине пока пусто
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
        Но это легко исправить! Выбирайте свежие овощи, молочные продукты, свежую выпечку и
        деликатесы с быстрой доставкой к вашей двери.
      </p>

      {/* Быстрые ссылки на категории */}
      <div className="mx-auto mt-8 max-w-2xl">
        <p className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
          Популярные категории каталога
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/catalog/molochnye-produkty"
            className="flex min-h-[90px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs"
          >
            <span className="mb-1 text-2xl">🧀</span>
            <span className="text-xs font-bold text-slate-800">Молоко и сыр</span>
          </Link>

          <Link
            href="/catalog/ovoshchi"
            className="flex min-h-[90px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs"
          >
            <span className="mb-1 text-2xl">🍎</span>
            <span className="text-xs font-bold text-slate-800">Овощи и фрукты</span>
          </Link>

          <Link
            href="/catalog"
            className="flex min-h-[90px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs"
          >
            <span className="mb-1 text-2xl">🥩</span>
            <span className="text-xs font-bold text-slate-800">Мясо и птица</span>
          </Link>

          <Link
            href="/catalog/khleb-i-vypechka"
            className="flex min-h-[90px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs"
          >
            <span className="mb-1 text-2xl">🥐</span>
            <span className="text-xs font-bold text-slate-800">Хлеб и выпечка</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href={ROUTES.CATALOG}
          className="inline-flex min-h-[44px] min-w-[40px] items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] hover:bg-emerald-700 active:scale-95"
        >
          <span>Перейти в каталог</span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
};

const BenefitsPanel = () => {
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-center gap-3.5 p-4">
        <Clock className="size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-xs font-bold text-slate-900">Быстрая доставка</p>
          <p className="text-[11px] text-slate-500">Доставим заказ от 30 минут</p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 p-4">
        <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-xs font-bold text-slate-900">Гарантия свежести</p>
          <p className="text-[11px] text-slate-500">Контроль качества каждого продукта</p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 p-4">
        <LockKeyhole className="size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-xs font-bold text-slate-900">Безопасная оплата</p>
          <p className="text-[11px] text-slate-500">Картой онлайн или при получении</p>
        </div>
      </div>
    </div>
  );
};

export const CartSkeleton = () => {
  return (
    <main className="min-h-[75vh] bg-slate-50/50 py-6 md:py-10">
      <Container>
        <div className="mb-6 h-4 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="mb-8 flex items-center justify-between">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-4">
            <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-200" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
              />
            ))}
          </div>
          <div className="h-80 w-full animate-pulse rounded-3xl border border-slate-200 bg-white p-6" />
        </div>
      </Container>
    </main>
  );
};

const roundQty = (val: number): number => {
  return Math.round(val * 100) / 100;
};

const formatQty = (val: number): string => {
  return Number.isInteger(val) ? String(val) : String(Number(val.toFixed(2)));
};

const pluralizeProducts = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "товаров";
  }

  if (lastDigit === 1) {
    return "товар";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "товара";
  }

  return "товаров";
};
