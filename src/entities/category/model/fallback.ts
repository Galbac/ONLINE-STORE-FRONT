import type { CategoryListResponse, CategoryTreeResponse } from "../types";

export const fallbackCategories: CategoryListResponse = {
  items: [
    {
      id: 1,
      name: "Овощи и зелень",
      slug: "ovoschi-i-zelen",
      image_url: null,
      sort_order: 1,
      products_count: 128,
    },
    {
      id: 2,
      name: "Фрукты и ягоды",
      slug: "frukty-i-yagody",
      image_url: null,
      sort_order: 2,
      products_count: 72,
    },
    {
      id: 3,
      name: "Молоко и яйца",
      slug: "moloko-i-yaytsa",
      image_url: null,
      sort_order: 3,
      products_count: 96,
    },
    {
      id: 4,
      name: "Мясо и птица",
      slug: "myaso-i-ptitsa",
      image_url: null,
      sort_order: 4,
      products_count: 83,
    },
    {
      id: 5,
      name: "Рыба",
      slug: "ryba",
      image_url: null,
      sort_order: 5,
      products_count: 41,
    },
    {
      id: 6,
      name: "Напитки",
      slug: "napitki",
      image_url: null,
      sort_order: 6,
      products_count: 117,
    },
  ],
  total: 6,
  limit: 12,
  offset: 0,
};

export const fallbackCategoryTree: CategoryTreeResponse = {
  items: fallbackCategories.items.map((category) => ({
    ...category,
    children: [],
  })),
};
