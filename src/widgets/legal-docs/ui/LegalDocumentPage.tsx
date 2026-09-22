import Link from "next/link";

import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalDocumentPageProps {
  title: string;
  description: string;
  sections?: LegalSection[];
  contentHtml?: string | null;
  updatedDate?: string | null;
}

export const LegalDocumentPage = ({
  description,
  sections,
  contentHtml,
  title,
  updatedDate,
}: LegalDocumentPageProps) => {
  return (
    <>
      <Header />
      <main>
        <Container className="py-6 md:py-10">
          <nav className="text-text-secondary mb-6 flex flex-wrap items-center gap-2 text-sm">
            <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span>{title}</span>
          </nav>

          <article className="mx-auto max-w-4xl">
            <header className="border-border bg-bg-secondary rounded-xl border px-5 py-6 md:px-8 md:py-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-text-secondary text-sm font-semibold">{STORE_INFO.name}</p>
                {updatedDate && (
                  <p className="text-text-secondary text-xs">
                    Редакция от {new Date(updatedDate).toLocaleDateString("ru-RU")}
                  </p>
                )}
              </div>
              <h1 className="text-text-primary mt-3 text-3xl leading-tight font-bold md:text-5xl">
                {title}
              </h1>
              <p className="text-text-secondary mt-4 max-w-3xl text-base leading-7">
                {description}
              </p>
            </header>

            <div className="mt-6">
              {contentHtml ? (
                <div className="border-border bg-bg-primary rounded-xl border p-6 md:p-10 shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
                  <div
                    className="rich-text-content text-text-primary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </div>
              ) : sections && sections.length > 0 ? (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <section
                      className="border-border bg-bg-primary rounded-lg border p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:p-7"
                      key={section.title}
                    >
                      <h2 className="text-xl font-bold">{section.title}</h2>
                      <div className="text-text-secondary mt-4 space-y-3 text-sm leading-7 md:text-base">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
};
