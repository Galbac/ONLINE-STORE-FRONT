import type { Metadata } from "next";
import { legalDocumentApi } from "@/entities/legal-document";
import { STORE_INFO } from "@/shared/config";
import { LegalDocLayout, PUBLIC_OFFER_DOC } from "@/widgets/legal-docs";

export const metadata: Metadata = {
  title: `Публичная оферта интернет-магазина - ${STORE_INFO.name}`,
  description: PUBLIC_OFFER_DOC.description,
  openGraph: {
    title: `Публичная оферта интернет-магазина - ${STORE_INFO.name}`,
    description: PUBLIC_OFFER_DOC.description,
    type: "article",
  },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  let doc = null;
  try {
    doc = await legalDocumentApi.getPublic("offer");
  } catch {
    // API unavailable or document not found - use fallback configuration
  }

  if (doc && doc.content_html) {
    const updatedOfferDoc = {
      ...PUBLIC_OFFER_DOC,
      title: doc.title || PUBLIC_OFFER_DOC.title,
      description: doc.description || PUBLIC_OFFER_DOC.description,
      revisionIsoDate: doc.updated_date ? doc.updated_date.slice(0, 10) : PUBLIC_OFFER_DOC.revisionIsoDate,
      effectiveDate: doc.updated_date
        ? new Date(doc.updated_date).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : PUBLIC_OFFER_DOC.effectiveDate,
    };
    return <LegalDocLayout document={updatedOfferDoc} contentHtml={doc.content_html} />;
  }

  return <LegalDocLayout document={PUBLIC_OFFER_DOC} />;
}
