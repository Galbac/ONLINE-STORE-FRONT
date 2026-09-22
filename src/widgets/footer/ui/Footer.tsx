import Link from "next/link";
import { Clock, Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, PwaInstallButton } from "@/shared/ui";

interface FooterLink {
  href: string;
  label: string;
}

const buyerLinks: FooterLink[] = [
  {
    href: ROUTES.CATALOG,
    label: "Каталог товаров",
  },
  {
    href: ROUTES.CART,
    label: "Корзина",
  },
  {
    href: ROUTES.CHECKOUT,
    label: "Оформление заказа",
  },
  {
    href: ROUTES.PROFILE_ORDERS,
    label: "Мои заказы",
  },
];

const companyLinks: FooterLink[] = [
  {
    href: `${ROUTES.CATALOG}?has_discount=true`,
    label: "Акции и скидки",
  },
  {
    href: `${ROUTES.CATALOG}?sort=newest`,
    label: "Новинки",
  },
  {
    href: ROUTES.PROFILE_FAVORITES,
    label: "Избранное",
  },
];

const helpLinks: FooterLink[] = [
  {
    href: ROUTES.FEEDBACK,
    label: "Служба поддержки",
  },
  {
    href: ROUTES.FORGOT_PASSWORD,
    label: "Восстановление пароля",
  },
  {
    href: ROUTES.PROFILE_ADDRESSES,
    label: "Адреса доставки",
  },
  {
    href: ROUTES.PROFILE_NOTIFICATIONS,
    label: "Уведомления",
  },
];

const legalLinks: FooterLink[] = [
  {
    href: ROUTES.PRIVACY,
    label: "Политика конфиденциальности",
  },
  {
    href: ROUTES.PERSONAL_DATA_CONSENT,
    label: "Обработка данных",
  },
  {
    href: ROUTES.COOKIE_POLICY,
    label: "Политика cookies",
  },
  {
    href: ROUTES.OFFER,
    label: "Публичная оферта",
  },
];

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-slate-600">
      {/* Advantage bar */}
      <div className="border-b border-slate-100 bg-slate-50/60 py-6">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                <Sparkles size={20} />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Гарантия свежести</h4>
                <p className="text-xs text-slate-500">
                  Только проверенные поставщики и контроль срока
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                <Clock size={20} />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Доставка от 45 минут</h4>
                <p className="text-xs text-slate-500">Бережная доставка прямо до вашей двери</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Безопасная оплата</h4>
                <p className="text-xs text-slate-500">Картой онлайн или при получении заказа</p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main footer content */}
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link className="flex items-center gap-2.5" href={ROUTES.HOME}>
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white shadow-xs">
                <Sparkles size={18} />
              </span>
              <span className="text-lg font-extrabold text-slate-900">{STORE_INFO.name}</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {STORE_INFO.tagline}. Заказывайте любимые продукты онлайн в несколько кликов с быстрой
              доставкой.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">
                Магазин открыт ежедневно
              </span>
            </div>
            <div className="mt-4">
              <PwaInstallButton variant="footer" />
            </div>
          </div>

          <FooterColumn links={buyerLinks} title="Покупателям" />
          <FooterColumn links={companyLinks} title="Каталог" />
          <FooterColumn links={helpLinks} title="Помощь" />
          <FooterColumn links={legalLinks} title="Документы" />
        </div>

        {/* Contacts & bottom row */}
        <div className="mt-12 flex flex-col gap-6 border-t border-slate-100 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>© 2026 {STORE_INFO.name}. Все права защищены.</p>
            <p className="text-slate-400">
              {STORE_INFO.legalName} · ИНН {STORE_INFO.inn} · ОГРНИП {STORE_INFO.ogrn}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <a
              className="inline-flex items-center gap-1.5 text-slate-700 transition hover:text-emerald-700"
              href={STORE_INFO.phoneHref}
            >
              <Phone size={14} className="text-emerald-600" />
              {STORE_INFO.phone}
            </a>
            <span className="text-slate-300">•</span>
            <a
              className="inline-flex items-center gap-1.5 text-slate-700 transition hover:text-emerald-700"
              href={`mailto:${STORE_INFO.email}`}
            >
              <Mail size={14} className="text-emerald-600" />
              {STORE_INFO.email}
            </a>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <MapPin size={14} className="text-emerald-600" />
              {STORE_INFO.city}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-600">
              МИР
            </span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-600">
              СБП
            </span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-600">
              VISA / MC
            </span>
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
      <ul className="space-y-2.5 text-xs">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="text-slate-500 transition-colors hover:text-emerald-700"
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
