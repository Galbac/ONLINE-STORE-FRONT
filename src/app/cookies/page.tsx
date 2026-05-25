import type { Metadata } from "next";

import { STORE_INFO } from "@/shared/config";
import { LegalDocumentPage, type LegalSection } from "@/widgets/legal-docs";

export const metadata: Metadata = {
  title: `Политика cookies - ${STORE_INFO.name}`,
};

const sections: LegalSection[] = [
  {
    title: "1. Что такое cookies",
    paragraphs: [
      "Cookies - небольшие файлы и записи в браузере, которые помогают сайту узнавать устройство пользователя, сохранять сессию, корзину, настройки и техническое состояние интерфейса.",
    ],
  },
  {
    title: "2. Какие cookies используются",
    paragraphs: [
      "Сайт использует необходимые cookies для авторизации, работы корзины, защиты аккаунта и сохранения выбора пользователя по cookie-уведомлению.",
      "При подключении аналитики или рекламных инструментов могут использоваться аналитические cookies. Такие сервисы должны быть указаны в политике после фактического подключения.",
    ],
  },
  {
    title: "3. Цели использования",
    paragraphs: [
      "Cookies нужны для стабильной работы сайта, входа в аккаунт, оформления заказа, запоминания согласия, анализа ошибок и улучшения пользовательского опыта.",
    ],
  },
  {
    title: "4. Управление cookies",
    paragraphs: [
      "Пользователь может ограничить или удалить cookies в настройках браузера. При отключении необходимых cookies часть функций сайта, включая авторизацию и корзину, может работать некорректно.",
    ],
  },
];

export default function Page() {
  return (
    <LegalDocumentPage
      title="Политика использования cookies"
      description="Документ объясняет, какие cookies применяет сайт и как пользователь может ими управлять."
      sections={sections}
    />
  );
}

export const dynamic = "force-static";
