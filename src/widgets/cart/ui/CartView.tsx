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
import { apiClient } from "@/shared/api";
import {
  useCartStore,
  type CartItemResponse,
  type CartResponse,
  type CartSummaryResponse,
} from "@/entities/cart";
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
  } = useCartStore();

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [isPending] = useTransition();

  // Populate from initial props if provided and store is empty
  useEffect(() => {
    if (initialCart && initialSummary && cart.items.length === 0 && initialCart.items.length > 0) {
      setCart(initialCart, initialSummary);
    }
  }, [initialCart, initialSummary, cart.items.length, setCart]);

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
    <main className="min-h-[75vh] bg-slate-50/50 py-6 md:py-10">
      <Container>
        {/* Хлебные крошки */}
        <nav
          aria-label="Навигация"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500"
        >
          <Link className="transition-colors hover:text-emerald-700" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Корзина</span>
        </nav>

        {/* Заголовок страницы и действие очистки */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Корзина
            </h1>
            <span
              aria-live="polite"
              role="status"
              className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-1 text-xs sm:text-sm font-extrabold text-emerald-800 border border-emerald-100"
            >
              {summary.items_count} {pluralizeProducts(summary.items_count)}
            </span>
          </div>

          {hasItems && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => clearCart()}
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto px-2 py-1"
              aria-label="Очистить корзину полностью"
            >
              <Trash2 size={16} />
              <span>Очистить корзину</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-xs">
            <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
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
                  <p className="mb-2 font-bold text-amber-900 text-sm flex items-center gap-1.5">
                    <AlertCircle size={16} className="text-amber-600" />
                    Ограничения по заказу:
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-amber-800">
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
                  <h2 id="promo-heading" className="text-base font-bold text-slate-900 mb-3">
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
                            Промокод <span className="font-mono font-extrabold">«{appliedPromo}»</span> применён
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
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition px-2 cursor-pointer"
                        aria-label="Удалить применённый промокод"
                      >
                        Удалить
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="Введите промокод"
                          disabled={isBusy}
                          className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold tracking-wider placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors uppercase"
                          aria-label="Код промокода"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isBusy || !promoCodeInput.trim()}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
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
            <aside className="xl:sticky xl:top-6 space-y-4">
              <OrderSummaryCard
                summary={summary}
                isBusy={isBusy}
                freeDeliveryThreshold={freeDeliveryThreshold}
              />
              <BenefitsPanel />
            </aside>

            {/* Мобильная плавающая плашка оформления заказа */}
            <div className="fixed bottom-[calc(56px+var(--sab,0px))] left-0 right-0 z-40 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 xl:hidden">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 leading-tight">К оплате:</p>
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-xl font-black text-slate-900 leading-tight truncate"
                >
                  {toPriceFormat(summary.final_price)}
                </p>
              </div>
              <Link
                href={ROUTES.CHECKOUT}
                className={cn(
                  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 active:scale-95 transition shrink-0",
                  isBusy && "pointer-events-none opacity-50",
                )}
                aria-label="Перейти к оформлению заказа"
              >
                <span>Оформить заказ</span>
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
    pendingAction === 'quantity-' + item.id ||
    pendingAction === 'delete-' + item.id ||
    pendingAction === 'fav-' + item.id;

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
        "group relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-emerald-500/30 hover:shadow-md",
        isCurrentBusy && "opacity-70",
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Изображение товара */}
        <Link
          href={item.slug ? ROUTES.PRODUCT(item.slug) : ROUTES.CATALOG}
          className="relative flex size-24 sm:size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/60 p-2 mx-auto sm:mx-0"
        >
          {item.preview_image_url ? (
            <Image
              src={item.preview_image_url}
              alt={item.name}
              fill
              sizes="112px"
              className="object-contain p-1 transition-transform group-hover:scale-105"
            />
          ) : (
            <ShoppingBag className="text-emerald-600 size-10" />
          )}
        </Link>

        {/* Название, цена за единицу и наличие */}
        <div className="min-w-0 flex-1">
          <Link
            href={item.slug ? ROUTES.PRODUCT(item.slug) : ROUTES.CATALOG}
            className="line-clamp-2 text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-700 transition leading-snug"
          >
            {item.name}
          </Link>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {toPriceFormat(item.price)}
              <span className="text-slate-400 font-normal ml-1">/ {item.unit}</span>
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
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t border-slate-100 sm:border-0 pt-3 sm:pt-0">
          {/* Степпер количества с доступными кнопками min-h-[44px] */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-1 shadow-inner">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleMinus}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 active:scale-90 transition disabled:opacity-40 cursor-pointer"
              aria-label={'Уменьшить количество ' + item.name}
            >
              <Minus size={15} />
            </button>

            <span
              aria-live="polite"
              role="status"
              className="min-w-[44px] px-1 text-center font-black text-slate-900 text-sm"
            >
              {formatQty(quantity)}
            </span>

            <button
              type="button"
              disabled={isBusy}
              onClick={handlePlus}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 active:scale-90 transition disabled:opacity-40 cursor-pointer"
              aria-label={'Увеличить количество ' + item.name}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Итоговая цена позиции */}
          <div className="text-right min-w-[85px]">
            <p
              aria-live="polite"
              className="text-lg sm:text-xl font-black tracking-tight text-slate-900"
            >
              {toPriceFormat(item.final_price)}
            </p>
          </div>

          {/* Кнопки: «В избранное» и «Удалить» — min-h-[44px] min-w-[44px] */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isBusy}
              onClick={onMoveToFavorites}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition active:scale-90 cursor-pointer"
              aria-label={'Переместить ' + item.name + ' в избранное'}
              title="В избранное"
            >
              <Heart size={18} />
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={onRemove}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition active:scale-90 cursor-pointer"
              aria-label={'Удалить ' + item.name + ' из корзины'}
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
          <Truck size={17} className="text-emerald-600 shrink-0" />
          Бесплатная доставка от {toPriceFormat(threshold)}
        </span>
        <span className="font-semibold text-emerald-800">
          Добавьте еще на <strong className="font-black text-emerald-700 text-sm">{toPriceFormat(remaining)}</strong>
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
          style={{ width: percent + '%' }}
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

const OrderSummaryCard = ({
  freeDeliveryThreshold,
  isBusy,
  summary,
}: OrderSummaryCardProps) => {
  const currentTotal = Number(summary.final_price || 0);
  const isFreeDelivery = currentTotal >= freeDeliveryThreshold;
  const savings = Number(summary.discount_amount || 0) + Number(summary.promo_discount_amount || 0);

  return (
    <section
      aria-label="Сводка заказа"
      className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs"
    >
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mb-5">
        Ваш заказ
      </h2>

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
              <span className="text-emerald-600 font-extrabold">Бесплатно</span>
            ) : summary.delivery_price ? (
              toPriceFormat(summary.delivery_price)
            ) : (
              "Рассчитается при адресе"
            )}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-baseline justify-between gap-4">
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
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900 font-bold border border-emerald-100">
          <span className="flex items-center gap-1.5">
            <TicketPercent size={16} className="text-emerald-700" />
            Ваша экономия:
          </span>
          <span className="text-emerald-700 font-black text-sm">{toPriceFormat(savings)}</span>
        </div>
      )}

      {/* Большая кнопка оформления заказа min-h-[52px] */}
      <Link
        href={ROUTES.CHECKOUT}
        className={cn(
          "mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-base font-extrabold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.98] transition-all",
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

      <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-slate-500 leading-relaxed">
        Но это легко исправить! Выбирайте свежие овощи, молочные продукты, свежую выпечку и
        деликатесы с быстрой доставкой к вашей двери.
      </p>

      {/* Быстрые ссылки на категории */}
      <div className="mx-auto mt-8 max-w-2xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Популярные категории каталога
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/catalog/molochnye-produkty"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs min-h-[90px]"
          >
            <span className="text-2xl mb-1">🧀</span>
            <span className="text-xs font-bold text-slate-800">Молоко и сыр</span>
          </Link>

          <Link
            href="/catalog/ovoshchi"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs min-h-[90px]"
          >
            <span className="text-2xl mb-1">🍎</span>
            <span className="text-xs font-bold text-slate-800">Овощи и фрукты</span>
          </Link>

          <Link
            href="/catalog"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs min-h-[90px]"
          >
            <span className="text-2xl mb-1">🥩</span>
            <span className="text-xs font-bold text-slate-800">Мясо и птица</span>
          </Link>

          <Link
            href="/catalog/khleb-i-vypechka"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30 hover:shadow-xs min-h-[90px]"
          >
            <span className="text-2xl mb-1">🥐</span>
            <span className="text-xs font-bold text-slate-800">Хлеб и выпечка</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href={ROUTES.CATALOG}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95"
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
    <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center gap-3.5 p-4">
        <Clock className="size-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-900">Быстрая доставка</p>
          <p className="text-[11px] text-slate-500">Доставим заказ от 30 минут</p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 p-4">
        <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-900">Гарантия свежести</p>
          <p className="text-[11px] text-slate-500">Контроль качества каждого продукта</p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 p-4">
        <LockKeyhole className="size-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-900">Безопасная оплата</p>
          <p className="text-[11px] text-slate-500">Картой онлайн или при получении</p>
        </div>
      </div>
    </div>
  );
};

const CartSkeleton = () => {
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
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
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
