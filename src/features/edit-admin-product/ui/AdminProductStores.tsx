"use client";

import { useEffect, useState } from "react";
import { adminProductApi, type AdminProductStoreResponse } from "@/entities/admin-product";
import { getAdminErrorMessage, getStoredAdminAccessToken } from "@/shared/api";

export const AdminProductStores = ({ productId }: { productId: number }) => {
  const [stores, setStores] = useState<AdminProductStoreResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    setStores(null);
    adminProductApi.getStores(productId, getStoredAdminAccessToken())
      .then((items) => { if (active) setStores(items); })
      .catch((reason: unknown) => { if (active) setError(getAdminErrorMessage(reason, "Не удалось загрузить магазины")); });
    return () => { active = false; };
  }, [productId, attempt]);

  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <h2 className="text-lg font-bold">Цены и остатки по магазинам</h2>
      <p className="text-text-secondary mt-2 text-sm">Укажите доступный остаток и цену каждого магазина. Общая цена используется, пока отдельная цена не задана.</p>
      {error ? (
        <div className="mt-4 text-sm" role="alert">
          <p className="text-error">{error}</p>
          <button type="button" className="mt-2 underline" onClick={() => setAttempt((value) => value + 1)}>Повторить</button>
        </div>
      ) : stores === null ? (
        <div className="bg-bg-secondary mt-4 h-32 animate-pulse rounded-lg" aria-label="Загрузка магазинов" />
      ) : stores.length === 0 ? (
        <p className="text-text-secondary mt-4 text-sm">Добавьте действующий магазин в настройках доставки.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {stores.map((store) => <StoreForm key={store.store_id} productId={productId} store={store} />)}
        </div>
      )}
    </section>
  );
};

const StoreForm = ({ productId, store }: { productId: number; store: AdminProductStoreResponse }) => {
  const [useBasePrice, setUseBasePrice] = useState(store.uses_base_price);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputClass = "border-border mt-1 h-11 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-50";

  const save = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      await adminProductApi.updateStore(productId, store.store_id, {
        stock_quantity: String(formData.get("stock_quantity")),
        price: useBasePrice ? null : String(formData.get("price")),
        old_price: useBasePrice ? null : String(formData.get("old_price") || "").trim() || null,
      }, getStoredAdminAccessToken());
      setMessage("Сохранено");
    } catch (reason: unknown) {
      setError(getAdminErrorMessage(reason, "Не удалось сохранить"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="border-border rounded-lg border p-4" onSubmit={(event) => { void save(event); }}>
      <h3 className="font-semibold">{store.store_name}</h3>
      <p className="text-text-secondary mt-1 text-sm">{store.address}</p>
      <fieldset disabled={isSaving} className="mt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useBasePrice} onChange={(event) => setUseBasePrice(event.target.checked)} />
          Использовать общую цену
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Доступный остаток
            <input className={inputClass} type="number" name="stock_quantity" min="0" step="0.001" required defaultValue={Number(store.stock_quantity)} />
          </label>
          <label className="text-sm">Цена, ₽
            <input className={inputClass} type="number" name="price" min="0" step="0.01" required={!useBasePrice} disabled={useBasePrice} defaultValue={Number(store.price)} />
          </label>
          <label className="text-sm">Цена до скидки, ₽
            <input className={inputClass} type="number" name="old_price" min="0" step="0.01" disabled={useBasePrice} defaultValue={store.old_price ? Number(store.old_price) : ""} />
          </label>
        </div>
        <p className="text-text-muted mt-2 text-xs">В резерве: {Number(store.reserved_quantity)}</p>
        <button type="submit" className="bg-accent-primary text-accent-contrast mt-4 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">{isSaving ? "Сохраняем…" : "Сохранить магазин"}</button>
      </fieldset>
      {message && <p role="status" className="mt-2 text-sm text-emerald-600">{message}</p>}
      {error && <p role="alert" className="text-error mt-2 text-sm">{error}</p>}
    </form>
  );
};
