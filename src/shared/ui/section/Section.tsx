import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionProps {
  title: string;
  href?: string;
  children: React.ReactNode;
}

export const Section = ({ title, href, children }: SectionProps) => {
  return (
    <section className="py-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-text-primary text-2xl font-bold">{title}</h2>
        {href ? (
          <Link
            className="text-accent-primary inline-flex items-center gap-2 text-sm font-semibold"
            href={href}
          >
            Смотреть все
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
};
