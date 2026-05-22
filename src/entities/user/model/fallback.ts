import type { UserMeResponse } from "../types";

export const fallbackUserMe: UserMeResponse = {
  id: 1,
  name: "Иван Иванов",
  phone: "+7 (999) 123-45-67",
  email: "ivan.ivanov@example.com",
  role: "customer",
  is_active: true,
  is_verified: true,
  created_at: "2026-05-12T14:35:00Z",
  updated_at: "2026-05-22T10:00:00Z",
};
