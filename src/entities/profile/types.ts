export interface AddressCreateRequest {
  title?: string | null;
  city: string;
  street: string;
  house: string;
  building?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  intercom?: string | null;
  comment?: string | null;
  is_default?: boolean;
}

export interface AddressUpdateRequest {
  title?: string | null;
  city?: string | null;
  street?: string | null;
  house?: string | null;
  building?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  intercom?: string | null;
  comment?: string | null;
  is_default?: boolean | null;
}

export interface AddressResponse {
  id: number;
  title?: string | null;
  city: string;
  street: string;
  house: string;
  building?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  intercom?: string | null;
  comment?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressListResponse {
  items: AddressResponse[];
  total: number;
  limit: number;
  offset: number;
}
