import type { Metadata } from "next";
import { STORE_INFO } from "@/shared/config";
import { LegalDocLayout, PERSONAL_DATA_CONSENT_DOC } from "@/widgets/legal-docs";

export const metadata: Metadata = {
  title: `Согласие на обработку персональных данных - ${STORE_INFO.name}`,
  description: PERSONAL_DATA_CONSENT_DOC.description,
  openGraph: {
    title: `Согласие на обработку персональных данных (152-ФЗ) - ${STORE_INFO.name}`,
    description: PERSONAL_DATA_CONSENT_DOC.description,
    type: "article",
  },
};

export default function Page() {
  return <LegalDocLayout document={PERSONAL_DATA_CONSENT_DOC} />;
}

export const dynamic = "force-static";
