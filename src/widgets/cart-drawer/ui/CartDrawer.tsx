"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Sparkles, Trash2, Truck, X } from "lucide-react";
import { cartApi, type CartResponse } from "@/entities/cart";
import { productApi, type ProductShortResponse } from "@/entities/product";
import { apiClient } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { CART_CHANGED_EVENT, notifyCartChanged } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";
import { isAccessTokenValid } from "@/shared/lib/auth-token";

export const CART_DRAWER_EVENT = "grocerystore:cart-drawer";

export const openCartDrawer = () => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token");
    if (!token || !isAccessTokenValid(token)) {
      return;
    }
    window.dispatchEvent(new CustomEvent(CART_DRAWER_EVENT, { detail: { open: true } }));
  }
};

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<ProductShortResponse[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadCart = async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    const handleDrawer = (e: Event) => {
      const token = window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token");
      if (!token || !isAccessTokenValid(token)) {
        window.location.assign(`/login?next=${encodeURIComponent(ROUTES.CART)}`);
        return;
      }
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      setIsOpen(detail?.open ?? true);
      if (detail?.open !== false) {
        void loadCart();
      }
    };

    window.addEventListener(CART_DRAWER_EVENT, handleDrawer);
    window.addEventListener(CART_CHANGED_EVENT, loadCart);

    apiClient
      .get<{ delivery?: { free_from_amount?: string | number | null } }>("/api/delivery/options")
      .then((res) => {
        const threshold = res.delivery?.free_from_amount ? Number(res.delivery.free_from_amount) : null;
        if (threshold && Number.isFinite(threshold) && threshold > 0) {
          setFreeDeliveryThreshold(threshold);
        }
      })
      .catch(() => {});

    productApi
      .getPopular()
      .then((res) => {
        if (res && res.items) {
          setSuggestedProducts(res.items);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener(CART_DRAWER_EVENT, handleDrawer);
      window.removeEventListener(CART_CHANGED_EVENT, loadCart);
    };
  }, []);

  const handleUpdateQty = (itemId: number, newQty: number) => {
    startTransition(async () => {
      try {
        if (newQty <= 0.001) {
          const res = await cartApi.deleteItem(itemId);
          setCart(res.cart);
          notifyCartChanged({ itemsCount: res.cart.items_count });
        } else {
          const res = await cartApi.updateItem(itemId, { quantity: newQty });
          setCart(res.cart);
          notifyCartChanged({ itemsCount: res.cart.items_count });
        }
      } catch {}
    });
  };

  const handleRemove = (itemId: number) => {
    startTransition(async () => {
      try {
        const res = await cartApi.deleteItem(itemId);
        setCart(res.cart);
        notifyCartChanged({ itemsCount: res.cart.items_count });
      } catch {}
    });
  };

  const handleQuickAdd = (productId: number) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(15); } catch (_) {}
    }
    startTransition(async () => {
      try {
        const res = await cartApi.addItem({ product_id: productId, quantity: 1 });
        setCart(res.cart);
        notifyCartChanged({ itemsCount: res.cart.items_count });
      } catch {}
    });
  };

  if (!isOpen) return null;
  const currentToken = typeof window !== "undefined"
    ? (window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token"))
    : null;
  if (!currentToken || !isAccessTokenValid(currentToken)) {
    return null;
  }

  const items = cart?.items ?? [];
  const cartProductIds = new Set(items.map((i) => i.product_id));
  const availableSuggestions = suggestedProducts.filter((p) => !cartProductIds.has(p.id) && p.is_available);
  const finalPriceNum = cart ? Number(cart.final_price) : 0;
  const diff = freeDeliveryThreshold ? freeDeliveryThreshold - finalPriceNum : null;
  const progressPercent =
    freeDeliveryThreshold && freeDeliveryThreshold > 0
      ? Math.min(100, Math.max(0, Math.round((finalPriceNum / freeDeliveryThreshold) * 100)))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div
        className="fixed inset-0"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Корзина</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {cart?.items_count ?? 0}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Delivery Bar */}
        {freeDeliveryThreshold && freeDeliveryThreshold > 0 && items.length > 0 ? (
          <div className="border-b border-slate-100 bg-emerald-50/40 p-4">
            {diff !== null && diff <= 0 ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Sparkles size={16} className="text-emerald-600 shrink-0" />
                Поздравляем! У вас бесплатная доставка 🎉
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-950">
                    <Truck size={14} className="text-emerald-600" />
                    До бесплатной доставки:
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    {diff !== null ? toPriceFormat(diff) : ""}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Body Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                <ShoppingBag size={32} />
              </div>
              <p className="text-base font-bold text-slate-800">Корзина пуста</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Выберите свежие продукты в каталоге, чтобы оформить доставку.
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                Перейти к покупкам
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-white p-3 shadow-2xs"
              >
                <div className="relative flex size-14 shrink-0 items-center justify-center rounded-lg bg-slate-50 overflow-hidden">
                  {item.preview_image_url ? (
                    <Image
                      src={item.preview_image_url}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  ) : (
                    <ShoppingBag size={20} className="text-slate-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-bold text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] font-extrabold text-slate-800">
                    {toPriceFormat(item.total_price)}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex h-7 items-center rounded-lg bg-slate-100 px-1 select-none">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUpdateQty(item.id, Number(item.quantity) - 1)}
                        className="flex size-5 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold px-2 text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUpdateQty(item.id, Number(item.quantity) + 1)}
                        className="flex size-5 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemove(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cross-sell Shelf */}
        {items.length > 0 && availableSuggestions.length > 0 ? (
          <div className="border-t border-slate-100 bg-slate-50/70 p-4 shrink-0">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Часто забывают добавить:</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {availableSuggestions.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col justify-between w-28 shrink-0 rounded-xl border border-slate-200/80 bg-white p-2 shadow-2xs"
                >
                  <div className="relative flex h-14 w-full items-center justify-center rounded-lg bg-slate-50 overflow-hidden mb-1.5">
                    {product.preview_image_url ? (
                      <Image
                        src={product.preview_image_url}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <ShoppingBag size={18} className="text-slate-300" />
                    )}
                  </div>
                  <p className="line-clamp-1 text-[11px] font-bold text-slate-900 leading-tight">
                    {product.name}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {toPriceFormat(product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickAdd(product.id)}
                      className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-90 transition"
                      aria-label={`Добавить ${product.name}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        {items.length > 0 && cart ? (
          <div className="border-t border-slate-100 p-5 space-y-3 bg-slate-50/50">
            <div className="flex items-baseline justify-between text-xs text-slate-600">
              <span>Сумма товаров:</span>
              <span className="font-semibold text-slate-800">{toPriceFormat(cart.subtotal)}</span>
            </div>
            {Number(cart.discount_amount) > 0 && (
              <div className="flex items-baseline justify-between text-xs text-emerald-700">
                <span>Скидка:</span>
                <span className="font-bold">-{toPriceFormat(cart.discount_amount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200/60">
              <span>Итого к оплате:</span>
              <span className="text-lg font-extrabold text-slate-900">
                {toPriceFormat(cart.final_price)}
              </span>
            </div>

            <Link
              href={ROUTES.CHECKOUT}
              onClick={() => setIsOpen(false)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 active:scale-98 transition"
            >
              <span>Оформить заказ</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href={ROUTES.CART}
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Перейти в полную корзину
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
};
