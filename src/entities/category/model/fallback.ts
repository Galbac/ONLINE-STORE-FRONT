import type { CategoryDetailResponse, CategoryListResponse, CategoryTreeResponse } from "../types";

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

export const fallbackCategoryDetail: CategoryDetailResponse = {
  id: 2,
  name: "Фрукты и ягоды",
  slug: "frukty-i-yagody",
  description:
    "Свежие фрукты и ягоды каждый день. Спелые, сочные и ароматные продукты для здорового питания, перекусов и домашнего стола.",
  image_url: null,
  sort_order: 2,
  products_count: 72,
  breadcrumbs: [
    {
      id: 2,
      name: "Фрукты и ягоды",
      slug: "frukty-i-yagody",
    },
  ],
  children: [
    {
      id: 21,
      name: "Яблоки",
      slug: "yabloki",
      image_url: null,
      parent_id: 2,
      sort_order: 1,
      products_count: 14,
    },
    {
      id: 22,
      name: "Бананы",
      slug: "banany",
      image_url: null,
      parent_id: 2,
      sort_order: 2,
      products_count: 8,
    },
    {
      id: 23,
      name: "Цитрусовые",
      slug: "tsitrusovye",
      image_url: null,
      parent_id: 2,
      sort_order: 3,
      products_count: 16,
    },
    {
      id: 24,
      name: "Ягоды",
      slug: "yagody",
      image_url: null,
      parent_id: 2,
      sort_order: 4,
      products_count: 12,
    },
    {
      id: 25,
      name: "Виноград",
      slug: "vinograd",
      image_url: null,
      parent_id: 2,
      sort_order: 5,
      products_count: 7,
    },
    {
      id: 26,
      name: "Экзотические фрукты",
      slug: "ekzoticheskie-frukty",
      image_url: null,
      parent_id: 2,
      sort_order: 6,
      products_count: 9,
    },
  ],
};

export const fallbackCategoryDetails: CategoryDetailResponse[] = [
  fallbackCategoryDetail,
  ...fallbackCategories.items
    .filter((category) => category.slug !== "frukty-i-yagody")
    .map((category) => ({
      ...category,
      description: `${category.name} с ежедневным обновлением ассортимента и проверенным качеством.`,
      breadcrumbs: [
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
      ],
      children: [],
    })),
];
