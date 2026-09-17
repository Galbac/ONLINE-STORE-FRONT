import { Container } from "@/shared/ui";

export default function Loading() {
  return (
    <main className="bg-bg-primary min-h-[70vh] py-8">
      <Container>
        {/* Баннер скелетон */}
        <div className="bg-bg-hover h-64 w-full animate-pulse rounded-lg md:h-80" />

        {/* Сетка категорий скелетон */}
        <div className="mt-10">
          <div className="bg-bg-hover h-8 w-48 animate-pulse rounded" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-bg-hover h-36 animate-pulse rounded-lg border border-border/40"
              />
            ))}
          </div>
        </div>

        {/* Сетка товаров скелетон */}
        <div className="mt-12">
          <div className="bg-bg-hover h-8 w-56 animate-pulse rounded" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-bg-hover h-72 animate-pulse rounded-lg border border-border/40"
              />
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
