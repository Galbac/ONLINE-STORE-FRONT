"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Clock,
  Info,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  cartApi,
  type CartItemResponse,
  type CartResponse,
  type CartSummaryResponse,
} from "@/entities/cart";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { Button, Container } from "@/shared/ui";

interface CartViewProps {
  initialCart: CartResponse;
  initialSummary: CartSummaryResponse;
}

interface MutationResult {
  cart: CartResponse;
  summary: CartSummaryResponse;
}

const quantityStepByType: Record<string, number> = {
  weight: 0.1,
  weighted: 0.1,
};

export const CartView = ({ initialCart, initialSummary }: CartViewProps) => {
  const [cart, setCart] = useState(initialCart);
  const [summary, setSummary] = useState(initialSummary);
  const [promoCode, setPromoCode] = useState(initialSummary.promo_code ?? "");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingAction !== null;

  const runCartMutation = (actionKey: string, mutation: () => Promise<MutationResult>): void => {
    setPendingAction(actionKey);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await mutation();
        setCart((currentCart) => preserveCartItemsOrder(result.cart, currentCart.items));
        setSummary(result.summary);
        setPromoCode(result.summary.promo_code ?? result.cart.promo_code?.code ?? "");
        notifyCartChanged({ itemsCount: result.summary.items_count });
      } catch {
        setErrorMessage("Не удалось обновить корзину. Попробуйте еще раз.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const refreshSummary = async (nextCart: CartResponse): Promise<MutationResult> => {
    const nextSummary = await cartApi.getSummary();

    return {
      cart: nextCart,
      summary: nextSummary,
    };
  };

  const handleQuantityChange = (item: CartItemResponse, nextQuantity: number): void => {
    if (nextQuantity <= 0) {
      handleDeleteItem(item.id);
      return;
    }

    runCartMutation(`quantity-${item.id}`, async () => {
      const response = await cartApi.updateItem(item.id, {
        quantity: normalizeQuantity(nextQuantity),
      });

      return refreshSummary(response.cart);
    });
  };

  const handleDeleteItem = (cartItemId: number): void => {
    runCartMutation(`delete-${cartItemId}`, async () => {
      const response = await cartApi.deleteItem(cartItemId);

      return refreshSummary(response.cart);
    });
  };

  const handleClearCart = (): void => {
    runCartMutation("clear", async () => {
      const response = await cartApi.clear();

      return refreshSummary(response.cart);
    });
  };

  const handlePromoCheck = (): void => {
    const code = promoCode.trim();

    if (code.length < 2) {
      setPromoMessage(null);
      setErrorMessage("Введите промокод от 2 символов.");
      return;
    }

    setPendingAction("promo-check");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await cartApi.checkPromoCode({
          code,
          cart_total: summary.subtotal,
        });
        setPromoMessage(response.message);
      } catch {
        setPromoMessage(null);
        setErrorMessage("Не удалось проверить промокод.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handlePromoApply = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const code = promoCode.trim();

    if (code.length < 2) {
      setPromoMessage(null);
      setErrorMessage("Введите промокод от 2 символов.");
      return;
    }

    runCartMutation("promo-apply", async () => {
      const response = await cartApi.applyPromoCodeToCart({ code });
      setPromoMessage(response.message);

      return refreshSummary(response.cart);
    });
  };

  const handlePromoRemove = (): void => {
    runCartMutation("promo-remove", async () => {
      const response = await cartApi.removePromoCode();
      setPromoMessage(response.message);

      return refreshSummary(response.cart);
    });
  };

  const hasItems = cart.items.length > 0;
  const appliedPromoCode = summary.promo_code ?? cart.promo_code?.code ?? null;

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-7 flex items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <span>Корзина</span>
        </nav>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Корзина</h1>
            <p className="text-text-secondary mt-6 text-base">
              {summary.items_count} {pluralizeProducts(summary.items_count)}
            </p>
          </div>
          {hasItems ? (
            <button
              className="text-error inline-flex h-10 items-center gap-2 self-start rounded-lg px-1 text-sm font-semibold transition hover:opacity-75 md:self-end"
              type="button"
              disabled={isBusy}
              onClick={handleClearCart}
            >
              <Trash2 size={16} />
              Очистить корзину
            </button>
          ) : null}
        </div>

        {errorMessage ? (
          <StatusMessage className="mb-5 border-red-200 bg-red-50 text-red-700">
            {errorMessage}
          </StatusMessage>
        ) : null}

        {hasItems ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-6">
              <section className="space-y-5">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    disabled={isBusy}
                    isPending={
                      pendingAction === `quantity-${item.id}` ||
                      pendingAction === `delete-${item.id}`
                    }
                    onQuantityChange={handleQuantityChange}
                    onDelete={handleDeleteItem}
                  />
                ))}

                {cart.warnings.length > 0 ? (
                  <div className="border-warning/30 bg-warning/10 rounded-lg border p-4">
                    <p className="text-text-primary mb-3 font-bold">Есть ограничения по товарам</p>
                    <ul className="space-y-2">
                      {cart.warnings.map((warning) => (
                        <li className="text-text-secondary text-sm" key={warning.product_id}>
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              <PromoPanel
                appliedPromoCode={appliedPromoCode}
                disabled={isBusy}
                message={promoMessage}
                pendingAction={pendingAction}
                promoCode={promoCode}
                onApply={handlePromoApply}
                onCheck={handlePromoCheck}
                onPromoCodeChange={setPromoCode}
                onRemove={handlePromoRemove}
              />
            </div>

            <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
              <SummaryPanel summary={summary} disabled={isBusy || !hasItems} />
              <BenefitsPanel />
            </aside>
          </div>
        ) : (
          <EmptyCart />
        )}
      </Container>
    </main>
  );
};

interface CartItemProps {
  item: CartItemResponse;
  disabled: boolean;
  isPending: boolean;
  onQuantityChange: (item: CartItemResponse, quantity: number) => void;
  onDelete: (cartItemId: number) => void;
}

const CartItem = ({ disabled, isPending, item, onDelete, onQuantityChange }: CartItemProps) => {
  const quantity = Number(item.quantity);
  const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
  const quantityStep = quantityStepByType[item.product_type ?? ""] ?? 1;
  const nextMinusQuantity = roundQuantity(safeQuantity - quantityStep);
  const nextPlusQuantity = roundQuantity(safeQuantity + quantityStep);

  return (
    <article
      className={cn(
        "border-border bg-bg-primary grid gap-4 rounded-lg border p-4 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:grid-cols-[160px_minmax(0,1fr)] md:items-center xl:grid-cols-[170px_minmax(0,1fr)_120px_160px_110px_28px] xl:p-5",
        isPending && "opacity-70",
      )}
    >
      <Link
        className="bg-bg-primary relative grid h-32 w-full place-items-center overflow-hidden rounded-lg md:h-36 md:w-40"
        href={item.slug ? ROUTES.PRODUCT(item.slug) : ROUTES.CATALOG}
      >
        {item.preview_image_url ? (
          <Image
            alt={item.name}
            className="object-contain"
            fill
            sizes="(max-width: 768px) 324px, 160px"
            src={item.preview_image_url}
          />
        ) : (
          <ShoppingBag className="text-accent-primary" size={42} />
        )}
      </Link>

      <div className="min-w-0 self-center">
        <Link
          className="text-text-primary hover:text-accent-primary line-clamp-2 text-lg font-bold transition"
          href={item.slug ? ROUTES.PRODUCT(item.slug) : ROUTES.CATALOG}
        >
          {item.name}
        </Link>
        <p className="text-text-secondary mt-2 text-sm">
          {formatQuantity(item.quantity)} {item.unit}
        </p>
        <p className="text-success mt-4 inline-flex items-center gap-2 text-sm font-semibold">
          <span className="bg-success size-2 rounded-full" />В наличии
        </p>

        {item.stock_warning ? (
          <p className="text-warning mt-3 text-sm font-semibold">{item.stock_warning}</p>
        ) : null}
      </div>

      <div className="flex items-start gap-2 md:col-start-2 xl:col-start-auto xl:block">
        <div>
          <p className="text-xl font-bold">{toPriceFormat(item.price)}</p>
          {item.old_price ? (
            <p className="text-text-muted mt-2 text-sm line-through">
              {toPriceFormat(item.old_price)}
            </p>
          ) : null}
          {item.old_price && item.discount_amount && Number(item.discount_amount) > 0 ? (
            <span className="bg-error mt-2 inline-flex rounded-md px-2 py-1 text-xs font-bold text-white">
              -{calculateDiscountPercent(item.price, item.old_price)}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 md:col-start-2 xl:col-start-auto">
        <QuantityControl
          disabled={disabled}
          quantity={safeQuantity}
          quantityStep={quantityStep}
          onDecrease={() => onQuantityChange(item, nextMinusQuantity)}
          onIncrease={() => onQuantityChange(item, nextPlusQuantity)}
          onManualChange={(quantity) => onQuantityChange(item, quantity)}
        />
        <p className="text-text-muted text-center text-xs">{item.unit}</p>
      </div>

      <p className="text-xl font-bold md:col-start-2 xl:col-start-auto xl:text-right">
        {toPriceFormat(item.final_price)}
      </p>

      <button
        className="text-text-muted hover:text-error grid size-9 place-items-center rounded-lg transition md:absolute md:top-4 md:right-4 xl:static xl:size-8"
        type="button"
        disabled={disabled}
        onClick={() => onDelete(item.id)}
        aria-label={`Удалить ${item.name}`}
      >
        <X size={20} />
      </button>
    </article>
  );
};

interface QuantityControlProps {
  disabled: boolean;
  quantity: number;
  quantityStep: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onManualChange: (quantity: number) => void;
}

const QuantityControl = ({
  disabled,
  onDecrease,
  onIncrease,
  onManualChange,
  quantity,
  quantityStep,
}: QuantityControlProps) => {
  const [inputValue, setInputValue] = useState(formatQuantity(quantity));

  useEffect(() => {
    setInputValue(formatQuantity(quantity));
  }, [quantity]);

  const commitInputValue = (): void => {
    const nextQuantity = normalizeManualQuantity(inputValue, quantityStep);

    if (nextQuantity === null) {
      setInputValue(formatQuantity(quantity));
      return;
    }

    if (nextQuantity !== quantity) {
      onManualChange(nextQuantity);
      return;
    }

    setInputValue(formatQuantity(quantity));
  };

  return (
    <div className="border-border grid h-12 grid-cols-[44px_minmax(66px,1fr)_44px] overflow-hidden rounded-lg border">
      <button
        className="hover:bg-bg-hover grid place-items-center transition disabled:opacity-50"
        type="button"
        disabled={disabled}
        onClick={onDecrease}
        aria-label="Уменьшить количество"
      >
        <Minus size={16} />
      </button>
      <input
        className="border-border min-w-0 border-x px-2 text-center text-sm font-bold outline-none focus:bg-bg-hover disabled:bg-bg-secondary"
        aria-label="Количество товара"
        disabled={disabled}
        inputMode="decimal"
        min={quantityStep}
        step={quantityStep}
        type="number"
        value={inputValue}
        onBlur={commitInputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitInputValue();
            event.currentTarget.blur();
          }
        }}
      />
      <button
        className="hover:bg-bg-hover grid place-items-center transition disabled:opacity-50"
        type="button"
        disabled={disabled}
        onClick={onIncrease}
        aria-label="Увеличить количество"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

interface PromoPanelProps {
  appliedPromoCode: string | null;
  disabled: boolean;
  message: string | null;
  pendingAction: string | null;
  promoCode: string;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onCheck: () => void;
  onPromoCodeChange: (value: string) => void;
  onRemove: () => void;
}

const PromoPanel = ({
  appliedPromoCode,
  disabled,
  message,
  onApply,
  onCheck,
  onPromoCodeChange,
  onRemove,
  pendingAction,
  promoCode,
}: PromoPanelProps) => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <h2 className="mb-4 font-bold">Промокод</h2>

      <form
        className="grid gap-4 lg:grid-cols-[minmax(0,360px)_118px_minmax(240px,1fr)_auto]"
        onSubmit={onApply}
      >
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:contents">
          <input
            className="border-border bg-bg-primary focus:border-accent-primary h-12 min-w-0 flex-1 rounded-lg border px-4 text-sm transition outline-none"
            maxLength={50}
            minLength={2}
            placeholder="Введите код"
            value={promoCode}
            disabled={disabled}
            onChange={(event) => onPromoCodeChange(event.target.value.toUpperCase())}
          />
          <Button type="submit" disabled={disabled || pendingAction === "promo-apply"}>
            Применить
          </Button>
        </div>

        <div className="bg-bg-hover flex min-h-12 items-center gap-3 rounded-lg px-4 py-3">
          <span className="bg-success text-accent-contrast grid size-7 shrink-0 place-items-center rounded-full">
            <Check size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-success text-sm font-bold">
              {appliedPromoCode ? "Промокод применён" : "Промокод будет проверен"}
            </p>
            <p className="text-text-secondary text-sm">
              {message ?? "Скидка появится в итогах после применения"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="text-text-secondary hover:text-accent-primary inline-flex size-10 items-center justify-center rounded-lg transition"
            type="button"
            disabled={disabled || pendingAction === "promo-check"}
            onClick={onCheck}
            aria-label="Проверить промокод"
          >
            <TicketPercent size={19} />
          </button>
          {appliedPromoCode ? (
            <button
              className="text-error text-sm font-semibold underline-offset-4 transition hover:underline"
              type="button"
              disabled={disabled || pendingAction === "promo-remove"}
              onClick={onRemove}
            >
              Удалить
            </button>
          ) : null}
        </div>
      </form>

      <div className="bg-bg-secondary text-text-secondary mt-5 flex items-start gap-3 rounded-lg p-4 text-sm">
        <Info className="text-accent-primary mt-0.5 shrink-0" size={18} />
        <span>Промокод применяется только к подходящим товарам в корзине.</span>
      </div>
    </section>
  );
};

interface SummaryPanelProps {
  summary: CartSummaryResponse;
  disabled: boolean;
}

const SummaryPanel = ({ disabled, summary }: SummaryPanelProps) => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-[0_14px_40px_rgb(20_28_18/0.08)]">
      <h2 className="mb-6 text-xl font-bold">Ваш заказ</h2>
      <div className="space-y-4">
        <SummaryRow
          label={`Товаров (${summary.items_count})`}
          value={toPriceFormat(summary.subtotal)}
        />
        <SummaryRow
          label="Скидки на товары"
          value={`-${toPriceFormat(summary.discount_amount)}`}
          muted={Number(summary.discount_amount) <= 0}
        />
        <SummaryRow
          label="Промокод"
          value={`-${toPriceFormat(summary.promo_discount_amount)}`}
          muted={Number(summary.promo_discount_amount) <= 0}
        />
        <SummaryRow
          label="Доставка"
          value={
            summary.delivery_price ? toPriceFormat(summary.delivery_price) : "Будет рассчитана"
          }
          muted={!summary.delivery_price}
        />
      </div>
      <div className="border-border mt-6 flex items-end justify-between border-t pt-5">
        <span className="text-text-primary text-lg font-bold">К оплате</span>
        <span className="text-3xl font-bold">{toPriceFormat(summary.final_price)}</span>
      </div>
      {summary.has_warnings ? (
        <StatusMessage className="mt-4 border-amber-200 bg-amber-50 text-amber-700">
          Есть предупреждения по {summary.warnings_count} позициям.
        </StatusMessage>
      ) : null}
      <Link
        className={cn(
          "bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-6 inline-flex h-14 w-full items-center justify-center rounded-lg px-5 text-base font-bold transition",
          disabled && "pointer-events-none opacity-60",
        )}
        href="/checkout"
      >
        Оформить заказ
      </Link>
      {getSavings(summary) > 0 ? (
        <div className="bg-bg-hover mt-5 flex items-center justify-between gap-4 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TicketPercent className="text-accent-primary shrink-0" size={22} />
            <div>
              <p className="text-sm font-semibold">Вы экономите</p>
              <p className="text-text-muted text-xs">С учётом скидок и промокода</p>
            </div>
          </div>
          <span className="text-success shrink-0 font-bold">
            {toPriceFormat(getSavings(summary))}
          </span>
        </div>
      ) : null}
    </section>
  );
};

interface SummaryRowProps {
  label: string;
  value: string;
  muted?: boolean;
}

const SummaryRow = ({ label, muted = false, value }: SummaryRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("text-right font-semibold", muted && "text-text-muted")}>{value}</span>
    </div>
  );
};

interface StatusMessageProps {
  children: React.ReactNode;
  className?: string;
}

const StatusMessage = ({ children, className }: StatusMessageProps) => {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-4 text-sm", className)}>
      <AlertCircle className="mt-0.5 shrink-0" size={18} />
      <span>{children}</span>
    </div>
  );
};

const EmptyCart = () => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border px-6 py-14 text-center shadow-[0_10px_28px_rgb(20_28_18/0.06)]">
      <span className="bg-bg-hover text-accent-primary mx-auto grid size-16 place-items-center rounded-lg">
        <ShoppingBag size={30} />
      </span>
      <h2 className="mt-5 text-2xl font-bold">Корзина пустая</h2>
      <p className="text-text-secondary mx-auto mt-3 max-w-md">
        Добавьте товары из каталога, а итоговая сумма и скидки появятся здесь после обновления
        корзины.
      </p>
      <Link
        className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-6 inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-bold transition"
        href={ROUTES.CATALOG}
      >
        Перейти в каталог
      </Link>
    </section>
  );
};

const BenefitsPanel = () => {
  return (
    <section className="border-border bg-bg-primary divide-border overflow-hidden rounded-lg border shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <BenefitRow
        icon={<Clock size={25} />}
        title="Быстрая доставка"
        text="Доставим заказ от 30 минут"
      />
      <BenefitRow
        icon={<ShieldCheck size={25} />}
        title="Свежие продукты"
        text="Гарантия качества каждый день"
      />
      <BenefitRow
        icon={<LockKeyhole size={25} />}
        title="Безопасная оплата"
        text="Оплата онлайн или курьеру"
      />
      <BenefitRow
        icon={<Truck size={25} />}
        title="Удобное получение"
        text="Доставка или самовывоз"
      />
    </section>
  );
};

interface BenefitRowProps {
  icon: React.ReactNode;
  text: string;
  title: string;
}

const BenefitRow = ({ icon, text, title }: BenefitRowProps) => {
  return (
    <div className="flex items-start gap-4 p-5">
      <span className="text-accent-primary mt-1 shrink-0">{icon}</span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-text-secondary mt-1 text-sm">{text}</p>
      </div>
    </div>
  );
};

const roundQuantity = (value: number): number => {
  return Math.round(value * 10) / 10;
};

const preserveCartItemsOrder = (
  nextCart: CartResponse,
  currentItems: CartItemResponse[],
): CartResponse => {
  const orderById = new Map(currentItems.map((item, index) => [item.id, index]));

  return {
    ...nextCart,
    items: nextCart.items
      .slice()
      .sort((leftItem, rightItem) => getItemOrder(leftItem, orderById) - getItemOrder(rightItem, orderById)),
  };
};

const getItemOrder = (item: CartItemResponse, orderById: Map<number, number>): number => {
  return orderById.get(item.id) ?? Number.MAX_SAFE_INTEGER;
};

const normalizeQuantity = (value: number): number | string => {
  return Number.isInteger(value) ? value : value.toFixed(1);
};

const normalizeManualQuantity = (value: string, step: number): number | null => {
  const parsedValue = Number(value.replace(",", "."));

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  const roundedToStep = Math.round(parsedValue / step) * step;

  return roundQuantity(Math.max(step, roundedToStep));
};

const formatQuantity = (value: number | string): string => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(1);
};

const getSavings = (summary: CartSummaryResponse): number => {
  return Number(summary.discount_amount) + Number(summary.promo_discount_amount);
};

const calculateDiscountPercent = (price: string, oldPrice?: string | null): number => {
  const priceValue = Number(price);
  const oldPriceValue = Number(oldPrice);

  if (!Number.isFinite(priceValue) || !Number.isFinite(oldPriceValue) || oldPriceValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((1 - priceValue / oldPriceValue) * 100));
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
