import type { Metadata } from "next";
import { STORE_INFO } from "@/shared/config";
import { LegalDocLayout, PRIVACY_POLICY_DOC } from "@/widgets/legal-docs";

export const metadata: Metadata = {
  title: `Политика обработки персональных данных (152-ФЗ) - ${STORE_INFO.name}`,
  description: PRIVACY_POLICY_DOC.description,
  openGraph: {
    title: `Политика конфиденциальности - ${STORE_INFO.name}`,
    description: PRIVACY_POLICY_DOC.description,
    type: "article",
  },
};

export default function Page() {
  return <LegalDocLayout document={PRIVACY_POLICY_DOC} />;
}

export const dynamic = "force-static";
