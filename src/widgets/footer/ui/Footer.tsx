import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, Logo } from "@/shared/ui";

interface FooterLink {
  href: string;
  label: string;
}

const buyerLinks: FooterLink[] = [
  {
    href: ROUTES.CATALOG,
    label: "Каталог",
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
    label: "Акции",
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
    href: ROUTES.FORGOT_PASSWORD,
    label: "Восстановить пароль",
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
    label: "Политика персональных данных",
  },
  {
    href: ROUTES.PERSONAL_DATA_CONSENT,
    label: "Согласие на обработку данных",
  },
  {
    href: ROUTES.COOKIE_POLICY,
    label: "Cookies",
  },
  {
    href: ROUTES.OFFER,
    label: "Публичная оферта",
  },
];

export const Footer = () => {
  return (
    <footer className="border-border bg-bg-secondary mt-10 border-t">
      <Container className="py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr_1.2fr_1.2fr]">
          <div>
            <Logo />
            <p className="text-text-secondary mt-4 max-w-xs text-sm leading-6">
              Мы заботимся о качестве наших продуктов и делаем вашу жизнь вкуснее и удобнее каждый
              день.
            </p>
          </div>
          <FooterColumn links={buyerLinks} title="Покупателям" />
          <FooterColumn links={companyLinks} title="Компания" />
          <FooterColumn links={helpLinks} title="Помощь" />
          <FooterColumn links={legalLinks} title="Документы" />
          <div>
            <h3 className="mb-4 text-sm font-bold">Контакты</h3>
            <div className="text-text-secondary space-y-3 text-sm">
              <a
                className="text-text-primary flex items-center gap-2 font-bold"
                href={STORE_INFO.phoneHref}
              >
                <Phone size={17} className="text-accent-primary" />
                {STORE_INFO.phone}
              </a>
              <a className="flex items-center gap-2" href={`mailto:${STORE_INFO.email}`}>
                <Mail size={17} className="text-accent-primary" />
                {STORE_INFO.email}
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={17} className="text-accent-primary" />
                {STORE_INFO.address}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={17} className="text-accent-primary" />
                {STORE_INFO.workingHours}
              </span>
            </div>
          </div>
        </div>
        <div className="border-border text-text-muted mt-8 flex items-center justify-between border-t pt-5 text-sm">
          <span>© 2026 {STORE_INFO.name}. Все права защищены.</span>
          <span className="text-accent-primary font-bold">МИР · VISA · Mastercard</span>
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
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      <ul className="text-text-secondary space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="hover:text-accent-primary transition" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
