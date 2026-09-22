"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  legalDocumentApi,
  type AdminLegalDocumentListItem,
  type LegalDocument,
} from "@/entities/legal-document";
import { RichTextEditor } from "@/widgets/admin-rich-editor";

interface AdminLegalDocumentsViewProps {
  initialDocuments: AdminLegalDocumentListItem[];
  initialActiveDoc?: LegalDocument | null;
}

export const AdminLegalDocumentsView: React.FC<AdminLegalDocumentsViewProps> = ({
  initialDocuments,
  initialActiveDoc = null,
}) => {
  const [documents, setDocuments] = useState<AdminLegalDocumentListItem[]>(initialDocuments);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialActiveDoc?.slug || initialDocuments[0]?.slug || "offer",
  );
  const [currentDoc, setCurrentDoc] = useState<LegalDocument | null>(initialActiveDoc);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(!initialActiveDoc);

  // Form states for the currently selected document
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contentHtml, setContentHtml] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Sync form when currentDoc changes
  useEffect(() => {
    if (currentDoc) {
      setTitle(currentDoc.title || "");
      setDescription(currentDoc.description || "");
      setContentHtml(currentDoc.content_html || "");
      setIsActive(currentDoc.is_active);
      setHasChanges(false);
    }
  }, [currentDoc]);

  // Load document content when tab changes (if not already loaded)
  useEffect(() => {
    if (!selectedSlug) return;
    if (currentDoc && currentDoc.slug === selectedSlug) return;

    setIsLoadingDoc(true);
    legalDocumentApi
      .getAdminBySlug(selectedSlug)
      .then((doc) => {
        setCurrentDoc(doc);
      })
      .catch(() => {
        toast.error("Не удалось загрузить документ " + selectedSlug);
      })
      .finally(() => {
        setIsLoadingDoc(false);
      });
  }, [selectedSlug, currentDoc]);

  // Mark changes
  const handleContentChange = (val: string) => {
    setContentHtml(val);
    setHasChanges(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setHasChanges(true);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    setHasChanges(true);
  };

  const handleActiveToggle = () => {
    setIsActive(!isActive);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (!currentDoc) return;
    setTitle(currentDoc.title || "");
    setDescription(currentDoc.description || "");
    setContentHtml(currentDoc.content_html || "");
    setIsActive(currentDoc.is_active);
    setHasChanges(false);
    toast.info("Изменения сброшены до сохраненных");
  };

  const handleSave = () => {
    if (!selectedSlug || !title.trim()) {
      toast.error("Укажите название документа");
      return;
    }

    startTransition(async () => {
      try {
        const updated = await legalDocumentApi.updateAdmin(selectedSlug, {
          title: title.trim(),
          description: description.trim() || null,
          content_html: contentHtml,
          is_active: isActive,
        });

        setCurrentDoc(updated);
        setHasChanges(false);

        // Update list state
        setDocuments((prev) =>
          prev.map((d) =>
            d.slug === updated.slug
              ? {
                  ...d,
                  title: updated.title,
                  description: updated.description,
                  is_active: updated.is_active,
                  updated_date: updated.updated_date,
                }
              : d,
          ),
        );

        toast.success("Документ успешно сохранен!");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Ошибка при сохранении документа";
        toast.error(msg);
      }
    });
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const getPublicUrl = (slug: string) => {
    return slug === "offer"
      ? "/offer"
      : slug === "privacy"
      ? "/privacy"
      : slug === "personal-data-consent"
      ? "/personal-data-consent"
      : `/${slug}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent-primary" size={24} />
            <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">
              Оферта и юридические документы
            </h1>
          </div>
          <p className="text-text-secondary mt-1 text-sm">
            Редактирование публичной оферты, политики конфиденциальности и согласий с форматированием в стиле Word.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getPublicUrl(selectedSlug)}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-bg-primary hover:bg-bg-secondary text-text-primary inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition"
          >
            <ExternalLink size={14} />
            Открыть на сайте
          </a>

          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              className="border-border bg-bg-primary hover:bg-bg-secondary text-text-secondary hover:text-text-primary inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition"
            >
              <RotateCcw size={14} />
              Сбросить
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold transition disabled:opacity-60 shadow-xs active:scale-98 cursor-pointer"
          >
            <Save size={15} />
            {isPending ? "Сохранение..." : "Сохранить документ"}
          </button>
        </div>
      </section>

      {/* Document Selector Tabs */}
      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {documents.map((doc) => {
          const isSelected = doc.slug === selectedSlug;
          return (
            <button
              key={doc.slug}
              type="button"
              onClick={() => {
                if (doc.slug !== selectedSlug) {
                  setSelectedSlug(doc.slug);
                  setCurrentDoc(null);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isSelected
                  ? "bg-accent-primary text-accent-contrast shadow-sm"
                  : "bg-bg-primary text-text-secondary hover:text-text-primary border border-border hover:border-accent-primary/50"
              }`}
            >
              <FileText size={15} />
              <span>{doc.title}</span>
              {doc.is_active ? (
                <span
                  className={`size-2 rounded-full ${
                    isSelected ? "bg-accent-contrast" : "bg-emerald-500"
                  }`}
                  title="Активен"
                />
              ) : (
                <span className="size-2 rounded-full bg-slate-400" title="Отключен" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Editor & Metadata Form */}
      {isLoadingDoc ? (
        <div className="border-border bg-bg-primary shadow-soft flex min-h-96 items-center justify-center rounded-xl border p-8">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <div className="size-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
            <span className="text-sm">Загрузка документа...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata Cards: Title, URL, Status */}
          <div className="border-border bg-bg-primary shadow-soft rounded-xl border p-4 sm:p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  Название документа *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Публичная оферта"
                  className="border-border focus:border-accent-primary bg-bg-secondary/40 text-text-primary h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  URL-адрес документа на сайте
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPublicUrl(selectedSlug)}
                    className="border-border bg-bg-secondary/70 text-text-secondary h-10 w-full rounded-lg border px-3 text-xs font-mono select-all outline-none"
                  />
                  <a
                    href={getPublicUrl(selectedSlug)}
                    target="_blank"
                    rel="noreferrer"
                    className="border-border hover:bg-bg-secondary text-text-secondary hover:text-accent-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition"
                    title="Перейти на страницу"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Краткое описание (подзаголовок для покупателей)
              </label>
              <textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Документ описывает основные условия заказа, оплаты, доставки, самовывоза, возврата..."
                className="border-border focus:border-accent-primary bg-bg-secondary/40 text-text-primary min-h-16 w-full resize-y rounded-lg border px-3 py-2 text-xs leading-5 outline-none transition"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={handleActiveToggle}
                  className="size-4 rounded accent-emerald-600"
                />
                <span className="font-bold text-text-primary">
                  Отображать документ на сайте (активен)
                </span>
              </label>

              {currentDoc?.updated_date && (
                <span className="text-text-secondary flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Последнее обновление:{" "}
                  <strong className="font-medium text-text-primary">
                    {new Date(currentDoc.updated_date).toLocaleString("ru-RU")}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Word-like WYSIWYG Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Содержимое документа (редактор Word)
              </label>
              <span className="text-[11px] text-text-secondary">
                Горячие клавиши: <strong>Ctrl+B</strong> (жирный), <strong>Ctrl+U</strong> (подчеркивание), <strong>Ctrl+S</strong> (сохранить)
              </span>
            </div>

            <RichTextEditor
              value={contentHtml}
              onChange={handleContentChange}
              placeholder="Начните вводить текст юридического документа или вставьте готовый текст из Word..."
              minHeight="520px"
            />
          </div>

          {/* Bottom Save Bar */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold transition disabled:opacity-60 shadow-sm active:scale-98 cursor-pointer"
            >
              <Save size={16} />
              {isPending ? "Сохранение..." : "Сохранить документ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
