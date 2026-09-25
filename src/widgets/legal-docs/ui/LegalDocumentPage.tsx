import { LegalDocLayout } from "./LegalDocLayout";
import { DEFAULT_OPERATOR_INFO } from "../data/legalDocs";
import type { LegalDocumentConfig, LegalSection } from "../types";

export interface LegalDocumentPageProps {
  title: string;
  description: string;
  sections?: LegalSection[];
  contentHtml?: string | null;
  updatedDate?: string | null;
  slug?: "privacy" | "personal-data-consent" | "cookies" | "offer";
}

export const LegalDocumentPage = ({
  title,
  description,
  sections,
  contentHtml,
  updatedDate,
  slug = "offer",
}: LegalDocumentPageProps) => {
  const effectiveDate = updatedDate
    ? new Date(updatedDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "25 сентября 2026 г.";

  const mappedSections: LegalSection[] = (sections || []).map((s, idx) => ({
    id: s.id || `section-${idx + 1}`,
    order: s.order || idx + 1,
    title: s.title,
    shortTitle: s.shortTitle || s.title,
    paragraphs: s.paragraphs,
    subsections: s.subsections || undefined,
  }));

  const docConfig: LegalDocumentConfig = {
    slug,
    href: `/${slug}`,
    title,
    shortTitle: title.replace(/^Политика\s+/i, ""),
    description,
    revisionIsoDate: updatedDate ? updatedDate.slice(0, 10) : "2026-09-25",
    effectiveDate,
    sections: mappedSections,
    operatorInfo: DEFAULT_OPERATOR_INFO,
  };

  return <LegalDocLayout document={docConfig} contentHtml={contentHtml} />;
};
