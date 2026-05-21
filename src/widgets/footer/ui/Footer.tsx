import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container, Logo } from "@/shared/ui";

const buyerLinks = ["Как сделать заказ", "Способы оплаты", "Доставка", "Возврат товара"];
const companyLinks = ["О компании", "Новости", "Карьера", "Партнёрам"];
const helpLinks = ["Центр поддержки", "Условия использования", "Политика конфиденциальности"];

export const Footer = () => {
  return (
    <footer className="border-border bg-bg-secondary mt-10 border-t">
      <Container className="py-8">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_1.2fr]">
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
          <div>
            <h3 className="mb-4 text-sm font-bold">Контакты</h3>
            <div className="text-text-secondary space-y-3 text-sm">
              <a
                className="text-text-primary flex items-center gap-2 font-bold"
                href="tel:88005555555"
              >
                <Phone size={17} className="text-accent-primary" />8 (800) 555-55-55
              </a>
              <a className="flex items-center gap-2" href="mailto:info@supermarket.ru">
                <Mail size={17} className="text-accent-primary" />
                info@supermarket.ru
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={17} className="text-accent-primary" />
                Москва, ул. Примерная, д. 123
              </span>
            </div>
          </div>
        </div>
        <div className="border-border text-text-muted mt-8 flex items-center justify-between border-t pt-5 text-sm">
          <span>© 2026 СуперМаркет. Все права защищены.</span>
          <span className="text-accent-primary font-bold">МИР · VISA · Mastercard</span>
        </div>
      </Container>
    </footer>
  );
};

interface FooterColumnProps {
  title: string;
  links: string[];
}

const FooterColumn = ({ title, links }: FooterColumnProps) => {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      <ul className="text-text-secondary space-y-3 text-sm">
        {links.map((link) => (
          <li key={link}>
            <Link className="hover:text-accent-primary transition" href="#">
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
