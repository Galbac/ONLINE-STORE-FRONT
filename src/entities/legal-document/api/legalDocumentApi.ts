import { adminApiClient, apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminLegalDocumentListItem,
  AdminLegalDocumentUpdatePayload,
  LegalDocument,
} from "../types";

export const legalDocumentApi = {
  getPublic: async (slug: string): Promise<LegalDocument> => {
    return apiClient.get<LegalDocument>(API_ENDPOINTS.LEGAL_DOCUMENT.BY_SLUG(slug));
  },

  getAdminList: async (accessToken?: string | null): Promise<AdminLegalDocumentListItem[]> => {
    return adminApiClient.get<AdminLegalDocumentListItem[]>(
      API_ENDPOINTS.ADMIN.LEGAL_DOCUMENTS,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getAdminBySlug: async (slug: string, accessToken?: string | null): Promise<LegalDocument> => {
    return adminApiClient.get<LegalDocument>(
      API_ENDPOINTS.ADMIN.LEGAL_DOCUMENT_BY_SLUG(slug),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  updateAdmin: async (
    slug: string,
    data: AdminLegalDocumentUpdatePayload,
    accessToken?: string | null,
  ): Promise<LegalDocument> => {
    return adminApiClient.patch<AdminLegalDocumentUpdatePayload, LegalDocument>(
      API_ENDPOINTS.ADMIN.LEGAL_DOCUMENT_BY_SLUG(slug),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};
