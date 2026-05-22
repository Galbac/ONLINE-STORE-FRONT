export type UploadEntityType = "product" | "category" | "banner" | "pickup_point" | "other";

export interface UploadImageRequest {
  file: File;
  entity_type?: UploadEntityType | null;
}

export interface UploadFileResponse {
  id: number;
  url: string;
  original_filename: string;
  mime_type: string;
  size: number;
  storage_type: string;
  entity_type?: string | null;
  created_at: string;
}

export type UploadImageResponse = UploadFileResponse;

export interface UploadDeleteResponse {
  message: string;
}
