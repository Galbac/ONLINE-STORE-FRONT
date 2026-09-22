import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { legalDocumentApi } from "@/entities/legal-document";
import { ROUTES } from "@/shared/config";
import { AdminLegalDocumentsView } from "@/widgets/admin-legal-documents";

export const dynamic = "force-dynamic";

export default async function AdminLegalDocumentsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const documents = await legalDocumentApi.getAdminList(accessToken);
    let initialActiveDoc = null;
    const firstDoc = documents[0];
    if (firstDoc) {
      try {
        initialActiveDoc = await legalDocumentApi.getAdminBySlug(firstDoc.slug, accessToken);
      } catch {
        // Fallback if detail fetch fails
      }
    }
    return (
      <AdminLegalDocumentsView
        initialDocuments={documents}
        initialActiveDoc={initialActiveDoc}
      />
    );
  } catch {
    return (
      <AdminLegalDocumentsView
        initialDocuments={[
          {
            slug: "offer",
            title: "Публичная оферта",
            description: "Документ описывает основные условия заказа, оплаты, доставки, самовывоза, возврата и взаимодействия покупателя с продавцом.",
            is_active: true,
            updated_date: null,
          },
          {
            slug: "privacy",
            title: "Политика конфиденциальности",
            description: "Политика обработки персональных данных (152-ФЗ).",
            is_active: true,
            updated_date: null,
          },
          {
            slug: "personal-data-consent",
            title: "Согласие на обработку ПД",
            description: "Согласие на обработку персональных данных.",
            is_active: true,
            updated_date: null,
          },
          {
            slug: "cookies",
            title: "Политика cookies",
            description: "Политика использования cookies на сайте.",
            is_active: true,
            updated_date: null,
          },
        ]}
      />
    );
  }
}
