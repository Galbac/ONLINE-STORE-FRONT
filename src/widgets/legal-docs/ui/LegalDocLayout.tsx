"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  FileCheck2,
  FileText,
  Link as LinkIcon,
  Mail,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn, ROUTES, STORE_INFO } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { LEGAL_DOCS_NAV } from "../data/legalDocs";
import type { LegalDocumentConfig } from "../types";

interface LegalDocLayoutProps {
  document: LegalDocumentConfig;
  contentHtml?: string | null | undefined;
}

export function LegalDocLayout({ document, contentHtml }: LegalDocLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    document.sections[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  // Parse headings from HTML if contentHtml is provided
  const { processedHtml, htmlToc } = useMemo(() => {
    if (!contentHtml) return { processedHtml: null, htmlToc: [] };
    const toc: { id: string; title: string }[] = [];
    let counter = 0;
    const processed = contentHtml.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, innerText) => {
      counter += 1;
      const clean = innerText.replace(/<[^>]*>/g, "").trim();
      const id = `doc-sec-${counter}`;
      toc.push({ id, title: clean });
      return `<h2 id="${id}" class="scroll-mt-28 font-bold text-base sm:text-lg text-slate-900 mt-8 mb-3" ${attrs}>${innerText}</h2>`;
    });
    return { processedHtml: processed, htmlToc: toc };
  }, [contentHtml]);

  // Combined active TOC items
  const activeTocItems = useMemo(() => {
    if (contentHtml && htmlToc.length > 0) {
      return htmlToc.map((item, idx) => ({
        id: item.id,
        title: item.title,
        shortTitle: item.title,
        order: idx + 1,
      }));
    }
    return document.sections.map((s) => ({
      id: s.id,
      title: s.title,
      shortTitle: s.shortTitle || s.title,
      order: s.order,
    }));
  }, [contentHtml, htmlToc, document.sections]);

  // Setup IntersectionObserver for Table of Contents spy
  useEffect(() => {
    if (activeTocItems.length === 0) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      const visible = entries.find((e) => e.isIntersecting);
      if (visible) {
        setActiveSectionId(visible.target.id);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "-90px 0px -70% 0px",
      threshold: 0,
    });

    activeTocItems.forEach((item) => {
      const el = window.document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeTocItems]);

  // Copy direct anchor link to clipboard
  const handleCopyAnchor = (sectionId: string) => {
    const url = `${window.location.origin}${document.href}#${sectionId}`;
    navigator.clipboard.writeText(url);
    setCopiedSectionId(sectionId);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return document.sections;
    const q = searchQuery.toLowerCase().trim();
    return document.sections.filter((s) => {
      const titleMatch = s.title.toLowerCase().includes(q);
      const paragraphMatch = s.paragraphs.some((p) => p.toLowerCase().includes(q));
      return titleMatch || paragraphMatch;
    });
  }, [document.sections, searchQuery]);

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Hide global header during print */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="min-h-screen bg-slate-50/50 py-6 sm:py-10 print:bg-white print:p-0">
        <Container className="max-w-7xl">
          {/* Breadcrumbs (Hidden on print) */}
          <nav
            aria-label="Навигация по сайту"
            className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 print:hidden"
          >
            <Link className="transition hover:text-emerald-700" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span className="text-slate-400">Юридические документы</span>
            <span>/</span>
            <span className="text-slate-800">{document.shortTitle}</span>
          </nav>

          {/* Mobile Document Selector Tabs Carousel (Hidden on print) */}
          <div className="mb-6 overflow-x-auto pb-2 lg:hidden print:hidden">
            <div className="flex gap-2">
              {LEGAL_DOCS_NAV.map((navItem) => {
                const isActive = navItem.slug === document.slug;
                return (
                  <Link
                    key={navItem.slug}
                    href={navItem.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all active:scale-95",
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700",
                    )}
                  >
                    <span>{navItem.shortTitle}</span>
                    {navItem.badge && (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {navItem.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main 2-Column Responsive Grid */}
          <div className="grid gap-8 lg:grid-cols-[290px_1fr] xl:grid-cols-[320px_1fr] lg:items-start">
            {/* LEFT COLUMN: Sticky Sidebar Navigation (Desktop) */}
            <aside className="hidden lg:block space-y-6 sticky top-24 print:hidden">
              {/* Document Switcher Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
                    Документы магазина
                  </h3>
                  <span className="flex size-2 rounded-full bg-emerald-500" />
                </div>
                <nav aria-label="Юридические документы" className="space-y-1.5">
                  {LEGAL_DOCS_NAV.map((item) => {
                    const isCurrent = item.slug === document.slug;
                    return (
                      <Link
                        key={item.slug}
                        href={item.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={cn(
                          "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all",
                          isCurrent
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-2xs font-extrabold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText
                            size={15}
                            className={cn(
                              "shrink-0 transition",
                              isCurrent ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600",
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ml-1.5",
                              isCurrent
                                ? "bg-emerald-200/70 text-emerald-900"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* In-Document Table of Contents (TOC) */}
              {activeTocItems.length > 0 && (
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <h3 className="mb-3 text-xs font-black tracking-wider uppercase text-slate-400 flex items-center justify-between">
                    <span>Содержание документа</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {activeTocItems.length} пунктов
                    </span>
                  </h3>
                  <nav aria-label="Оглавление документа" className="space-y-1 text-xs">
                    {activeTocItems.map((item) => {
                      const isActive = activeSectionId === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-all leading-snug",
                            isActive
                              ? "bg-slate-100/90 text-emerald-700 font-bold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1 size-1.5 rounded-full shrink-0 transition-all",
                              isActive ? "bg-emerald-600 scale-125" : "bg-slate-300",
                            )}
                          />
                          <span className="line-clamp-2">{item.shortTitle || item.title}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Operator Legal Credentials Badge */}
              <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-5 shadow-xs space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Реквизиты оператора</span>
                </div>
                <div className="space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
                  <p className="font-semibold text-slate-800">{STORE_INFO.legalName}</p>
                  <p>ИНН: <span className="font-mono text-slate-700 font-semibold">{STORE_INFO.inn}</span></p>
                  <p>ОГРНИП: <span className="font-mono text-slate-700 font-semibold">{STORE_INFO.ogrn}</span></p>
                  <p className="pt-1 text-slate-600">{STORE_INFO.address}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <a
                    href={`mailto:${STORE_INFO.email}`}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    {STORE_INFO.email}
                  </a>
                  <span className="text-slate-300">•</span>
                  <a
                    href={STORE_INFO.phoneHref}
                    className="text-slate-700 font-semibold hover:text-emerald-700"
                  >
                    {STORE_INFO.phone}
                  </a>
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Document Article & Content */}
            <div className="space-y-6">
              {/* Official Print Header (Only visible in print output) */}
              <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-black text-black">{document.title}</h1>
                    <p className="text-xs text-gray-700 mt-1">
                      Официальный документ сервиса доставки «{STORE_INFO.name}»
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-600 font-mono">
                    <p>{document.operatorInfo.legalName}</p>
                    <p>ИНН {document.operatorInfo.inn} • ОГРНИП {document.operatorInfo.ogrn}</p>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-gray-500">
                  Редакция от {document.effectiveDate} • Сайт: eda-pobeda.ru • Служба заботы: {document.operatorInfo.phone}
                </div>
              </div>

              {/* Service Action Toolbar (Screen only) */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Revision Date Indicator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Calendar size={14} />
                    </span>
                    <span>
                      Редакция от{" "}
                      <time dateTime={document.revisionIsoDate} className="font-bold text-slate-800">
                        {document.effectiveDate}
                      </time>
                    </span>
                  </div>

                  {/* Actions: Search & Native Print */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Live in-doc search input */}
                    <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по документу..."
                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          aria-label="Очистить поиск"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Print / Save to PDF Button */}
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-emerald-300 hover:bg-slate-50 hover:text-emerald-700 active:scale-95 cursor-pointer"
                      title="Распечатать или сохранить в PDF"
                    >
                      <Printer size={14} />
                      <span className="hidden sm:inline">Печать / PDF</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Collapsible TOC Trigger Button */}
                {activeTocItems.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
                      className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileCheck2 size={14} className="text-emerald-600" />
                        Оглавление документа ({activeTocItems.length} разделов)
                      </span>
                      <ChevronDown
                        size={15}
                        className={cn("transition-transform", isMobileTocOpen && "rotate-180")}
                      />
                    </button>

                    {isMobileTocOpen && (
                      <nav
                        aria-label="Мобильное оглавление"
                        className="mt-2 space-y-1 rounded-xl border border-slate-200/80 bg-white p-2 text-xs animate-in fade-in-0 duration-150"
                      >
                        {activeTocItems.map((sec) => (
                          <a
                            key={sec.id}
                            href={`#${sec.id}`}
                            onClick={() => setIsMobileTocOpen(false)}
                            className="block rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            {sec.title}
                          </a>
                        ))}
                      </nav>
                    )}
                  </div>
                )}
              </div>

              {/* Main Document Typography Paper */}
              <article className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
                {/* Document Header */}
                <header className="border-b border-slate-100 pb-6 print:border-b-0 print:pb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider print:hidden">
                      {document.badge || "152-ФЗ"}
                    </span>
                    <span className="text-xs font-bold text-slate-400 print:hidden">
                      Магазин «{STORE_INFO.name}»
                    </span>
                  </div>
                  <h1 className="mt-2.5 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight print:hidden">
                    {document.title}
                  </h1>
                  <p className="mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                    {document.description}
                  </p>
                </header>

                {/* Document Body */}
                <div className="pt-6">
                  {processedHtml ? (
                    <div
                      className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 divide-y divide-slate-100 [&>p]:leading-relaxed [&>p]:text-slate-700 [&>h2]:pt-6 [&>h2:first-child]:pt-0"
                      dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />
                  ) : filteredSections.length > 0 ? (
                    <div className="space-y-8 divide-y divide-slate-100">
                      {filteredSections.map((section, idx) => (
                        <section
                          key={section.id}
                          id={section.id}
                          className={cn(
                            "scroll-mt-28 print:scroll-mt-0 print:break-inside-avoid",
                            idx > 0 && "pt-8",
                          )}
                        >
                          <div className="group flex items-center justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                              {section.title}
                            </h2>
                            <button
                              type="button"
                              onClick={() => handleCopyAnchor(section.id)}
                              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-emerald-700 active:scale-95 cursor-pointer print:hidden"
                              title="Скопировать ссылку на пункт"
                              aria-label={`Скопировать прямую ссылку на раздел ${section.title}`}
                            >
                              {copiedSectionId === section.id ? (
                                <Check size={14} className="text-emerald-600" />
                              ) : (
                                <LinkIcon size={14} />
                              )}
                            </button>
                          </div>

                          <div className="mt-3.5 space-y-2.5 text-xs sm:text-sm leading-relaxed text-slate-700 max-w-3xl">
                            {section.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="leading-relaxed">
                                {p}
                              </p>
                            ))}
                          </div>

                          {section.subsections && (
                            <div className="mt-4 space-y-4 pl-3 border-l-2 border-slate-100">
                              {section.subsections.map((sub) => (
                                <div key={sub.id} id={sub.id} className="scroll-mt-28">
                                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                                    {sub.title}
                                  </h3>
                                  <div className="mt-2 space-y-2 text-xs sm:text-sm text-slate-600">
                                    {sub.paragraphs.map((subP, subPIdx) => (
                                      <p key={subPIdx}>{subP}</p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                      <p className="text-xs text-slate-500">
                        По запросу «<span className="font-bold text-slate-700">{searchQuery}</span>» ничего не найдено в тексте документа.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Сбросить фильтр
                      </button>
                    </div>
                  )}
                </div>

                {/* Operator Credentials Footer Card inside Article */}
                <footer className="mt-12 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 text-xs text-slate-600 print:break-inside-avoid print:bg-white print:border print:p-4">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Building2 size={15} className="text-emerald-600" />
                    Юридические сведения и оператор сервиса
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 text-[11px] leading-relaxed">
                    <div>
                      <p className="font-semibold text-slate-800">{STORE_INFO.legalName}</p>
                      <p className="text-slate-500">ИНН: {STORE_INFO.inn} • ОГРНИП: {STORE_INFO.ogrn}</p>
                      <p className="text-slate-500">{STORE_INFO.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <a href={STORE_INFO.phoneHref} className="font-semibold text-slate-800 hover:text-emerald-700">
                          {STORE_INFO.phone}
                        </a>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" />
                        <a href={`mailto:${STORE_INFO.email}`} className="font-semibold text-slate-800 hover:text-emerald-700">
                          {STORE_INFO.email}
                        </a>
                      </p>
                    </div>
                  </div>
                </footer>
              </article>
            </div>
          </div>
        </Container>
      </main>

      {/* Hide global footer during print */}
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
