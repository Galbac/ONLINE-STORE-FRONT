"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiClient } from "@/shared/api";
import { Button, getStoredAccessToken } from "@/shared/ui";

interface BannerItem {
  id: number;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  link?: string | null;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("");
  const [link, setLink] = useState("/catalog");
  const [bgColor, setBgColor] = useState("#059669");
  const [sortOrder] = useState(0);

  
  const [isPending, startTransition] = useTransition();

  const loadBanners = async () => {
    try {
      const data = await apiClient.get<{ items: BannerItem[] }>("/api/banners");
      setBanners(data.items);
    } catch {
      // Fallback
    } finally {
      
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredAccessToken();
    if (!token || !title.trim()) return;

    startTransition(async () => {
      try {
        await apiClient.post(
          "/api/admin/banners",
          {
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            badge: badge.trim() || null,
            link: link.trim() || null,
            bg_color: bgColor,
            sort_order: Number(sortOrder) || 0,
            is_active: true,
          },
          { Authorization: `Bearer ${token}` },
        );
        setTitle("");
        setSubtitle("");
        setBadge("");
        setShowCreate(false);
        await loadBanners();
      } catch {
        // Fallback
      }
    });
  };

  const handleDelete = (bannerId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;

    startTransition(async () => {
      try {
        await apiClient.delete(`/api/admin/banners/${bannerId}`, {
          Authorization: `Bearer ${token}`,
        });
        await loadBanners();
      } catch {
        // Fallback
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Маркетинговые баннеры</h1>
          <p className="text-xs text-slate-500">Управление рекламными баннерами и акциями на главной странице</p>
        </div>

        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus size={16} />
          {showCreate ? "Отмена" : "Добавить баннер"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in-0 duration-150">
          <h2 className="text-sm font-bold text-slate-900">Новый баннер</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Заголовок *</label>
              <input
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="Свежие яблоки со скидкой 20%"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Подзаголовок</label>
              <input
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="Только до конца недели"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Текст бейджа</label>
              <input
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="Хит сезона"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ссылка</label>
              <input
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="/catalog"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Цвет подложки</label>
              <input
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                placeholder="#059669"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение..." : "Создать баннер"}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                {b.badge ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {b.badge}
                  </span>
                ) : <span />}
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-slate-300 hover:text-rose-500 transition p-1"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">{b.title}</h3>
              {b.subtitle ? <p className="mt-1 text-xs text-slate-500">{b.subtitle}</p> : null}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Ссылка: {b.link ?? "/catalog"}</span>
              <span className="size-4 rounded-full border border-slate-200" style={{ backgroundColor: b.bg_color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
