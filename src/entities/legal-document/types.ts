export interface LegalDocument {
  slug: string;
  title: string;
  description: string | null;
  content_html: string;
  is_active: boolean;
  updated_date: string | null;
}

export interface AdminLegalDocumentListItem {
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  updated_date: string | null;
}

export interface AdminLegalDocumentUpdatePayload {
  title?: string;
  description?: string | null;
  content_html?: string;
  is_active?: boolean;
}
