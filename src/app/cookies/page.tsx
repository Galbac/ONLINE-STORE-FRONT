import type { Metadata } from "next";
import { STORE_INFO } from "@/shared/config";
import { COOKIES_POLICY_DOC, LegalDocLayout } from "@/widgets/legal-docs";

export const metadata: Metadata = {
  title: `Политика использования файлов cookie - ${STORE_INFO.name}`,
  description: COOKIES_POLICY_DOC.description,
  openGraph: {
    title: `Политика использования файлов cookie - ${STORE_INFO.name}`,
    description: COOKIES_POLICY_DOC.description,
    type: "article",
  },
};

export default function Page() {
  return <LegalDocLayout document={COOKIES_POLICY_DOC} />;
}

export const dynamic = "force-static";
