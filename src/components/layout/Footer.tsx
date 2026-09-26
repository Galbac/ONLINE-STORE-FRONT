import Link from "next/link";
import { Mail, MapPin, Phone, QrCode, Sparkles } from "lucide-react";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, PwaInstallButton } from "@/shared/ui";
import { StoreScheduleBadge } from "@/widgets/footer/ui/StoreScheduleBadge";

interface FooterLink {
  href: string;
  label: string;
}

const buyerLinks: FooterLink[] = [
  { href: ROUTES.CATALOG, label: "Каталог товаров" },
  { href: "/catalog?has_discount=true", label: "Акции и спецпредложения" },
  { href: `${ROUTES.CATALOG}?sort=popular`, label: "Хиты продаж" },
  { href: ROUTES.CHECKOUT, label: "Оформление заказа" },
  { href: ROUTES.PROFILE_ORDERS, label: "Мои заказы" },
  { href: ROUTES.FAVORITES, label: "Список избранного" },
];

const helpAndDocLinks: FooterLink[] = [
  { href: ROUTES.FEEDBACK, label: "Служба поддержки" },
  { href: ROUTES.PROFILE_ADDRESSES, label: "Адреса и самовывоз" },
  { href: ROUTES.OFFER, label: "Публичная оферта" },
  { href: ROUTES.PRIVACY, label: "Политика конфиденциальности" },
  { href: ROUTES.PERSONAL_DATA_CONSENT, label: "Обработка персональных данных" },
  { href: ROUTES.COOKIE_POLICY, label: "Использование cookie" },
];

export interface FooterProps {
  showAdvantages?: boolean | undefined;
}

export const Footer = ({ showAdvantages: _showAdvantages }: FooterProps = {}) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-slate-600">
      <Container className="py-12">
        {/* Строгая 4-колоночная сетка */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Колонка 1: Логотип, описание сервиса, статус работы магазина */}
          <div className="flex flex-col">
            <Link className="flex items-center gap-2.5" href={ROUTES.HOME}>
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white shadow-xs">
                <Sparkles size={18} />
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {STORE_INFO.name}
              </span>
            </Link>
            {/* Исправлена типографика: нет опечатки "день!." */}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {STORE_INFO.tagline} Заказывайте любимые продукты онлайн в несколько кликов с быстрой и бережной доставкой до двери.
            </p>
            <div className="mt-4">
              <StoreScheduleBadge />
            </div>
          </div>

          {/* Колонка 2: Покупателям (ссылки) */}
          <FooterColumn links={buyerLinks} title="Покупателям" />

          {/* Колонка 3: Помощь и документы (ссылки) */}
          <FooterColumn links={helpAndDocLinks} title="Помощь и документы" />

          {/* Колонка 4: QR-код / блок установки приложения с кликабельными бейджами */}
          <div className="flex flex-col">
            <h3 className="mb-3.5 text-xs font-bold tracking-wider text-slate-900 uppercase">
              Мобильное приложение
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Установите веб-приложение для быстрых заказов и уведомлений об акциях.
            </p>
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-2xs">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-emerald-700 shadow-2xs">
                <QrCode size={36} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800">Заказывайте в приложении</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Всегда под рукой</span>
              </div>
            </div>
            <div className="mt-3">
              <PwaInstallButton variant="footer" />
            </div>
          </div>
        </div>

        {/* Нижняя часть футера: реквизиты, контакты, платежные системы */}
        <div className="mt-12 flex flex-col gap-6 border-t border-slate-100 pt-8 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          {/* Копирайт и реквизиты: исправлен лишний пробел "© 2026 Победа." */}
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">© 2026 Победа. Все права защищены.</p>
            <p className="text-[11px] text-slate-400">
              {STORE_INFO.legalName} · ИНН {STORE_INFO.inn} · ОГРНИП {STORE_INFO.ogrn}
            </p>
          </div>

          {/* Контакты */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <a
              className="inline-flex items-center gap-1.5 text-slate-700 transition hover:text-emerald-700"
              href={STORE_INFO.phoneHref}
            >
              <Phone size={14} className="text-emerald-600 shrink-0" />
              <span>{STORE_INFO.phone}</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              className="inline-flex items-center gap-1.5 text-slate-700 transition hover:text-emerald-700"
              href={`mailto:${STORE_INFO.email}`}
            >
              <Mail size={14} className="text-emerald-600 shrink-0" />
              <span>{STORE_INFO.email}</span>
            </a>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <MapPin size={14} className="text-emerald-600 shrink-0" />
              <span>{STORE_INFO.city}</span>
            </span>
          </div>

          {/* Платежные системы: строго в одну аккуратную строку без переноса Mastercard */}
          <div className="flex flex-col items-start lg:items-end gap-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {/* МИР */}
              <div className="inline-flex h-6.5 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-white px-2 py-0.5 shadow-2xs">
                <span className="font-black italic tracking-tighter text-emerald-600 text-[11px] leading-none">МИР</span>
              </div>
              {/* СБП */}
              <div className="inline-flex h-6.5 shrink-0 items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-0.5 shadow-2xs">
                <span className="flex size-3 items-center justify-center rounded-sm bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-[7px] font-black text-white leading-none">⚡</span>
                <span className="font-extrabold tracking-tight text-slate-800 text-[11px] leading-none">СБП</span>
              </div>
              {/* SberPay */}
              <div className="inline-flex h-6.5 shrink-0 items-center rounded-md border border-emerald-300 bg-emerald-600 px-2 py-0.5 shadow-2xs text-white">
                <span className="font-black tracking-tight text-[10px] leading-none">SberPay</span>
              </div>
              {/* T-Pay */}
              <div className="inline-flex h-6.5 shrink-0 items-center rounded-md border border-amber-300 bg-amber-400 px-2 py-0.5 shadow-2xs text-slate-950">
                <span className="font-black tracking-tight text-[10px] leading-none">T-Pay</span>
              </div>
              {/* Visa */}
              <div className="inline-flex h-6.5 shrink-0 items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 shadow-2xs">
                <span className="font-black italic tracking-wider text-blue-700 text-[11px] leading-none">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="inline-flex h-6.5 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 shadow-2xs">
                <div className="flex -space-x-1">
                  <span className="size-2 rounded-full bg-rose-500 opacity-90" />
                  <span className="size-2 rounded-full bg-amber-400 opacity-90" />
                </div>
                <span className="font-bold text-[9px] tracking-tight text-slate-700 leading-none">Mastercard</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 lg:text-right">
              Принимаются карты банков РФ и оплата через СБП
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

const FooterColumn = ({ title, links }: FooterColumnProps) => {
  return (
    <div>
      <h3 className="mb-3.5 text-xs font-bold tracking-wider text-slate-900 uppercase">{title}</h3>
      <ul className="space-y-2 text-xs">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="text-slate-500 transition-colors duration-150 hover:text-emerald-700"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
