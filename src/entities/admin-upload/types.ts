export type AdminUploadEntityType = "product" | "category" | "banner" | "pickup_point" | "other";

export interface AdminUploadImageRequest {
  entity_type?: AdminUploadEntityType | null;
  file: File;
}

export interface AdminUploadFileResponse {
  created_at: string;
  entity_type?: string | null;
  id: number;
  mime_type: string;
  original_filename: string;
  size: number;
  storage_type: string;
  stored_filename?: string;
  url: string;
}

export interface AdminUploadDeleteResponse {
  message: string;
}
