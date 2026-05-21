export interface DiscountShortResponse {
  id: number;
  name: string;
  type: string;
  discount_type: string;
  discount_value: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
}

export interface ActiveDiscountsResponse {
  items: DiscountShortResponse[];
  total: number;
  limit: number;
  offset: number;
}
