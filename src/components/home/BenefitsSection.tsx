import { Clock, ShieldCheck, Sparkles } from "lucide-react";

interface BenefitItem {
  icon: typeof Sparkles;
  title: string;
  description: string;
}

const BENEFITS: BenefitItem[] = [
  {
    icon: Sparkles,
    title: "Гарантия свежести",
    description: "Только проверенные поставщики и строгий ежедневный контроль сроков годности.",
  },
  {
    icon: Clock,
    title: "Доставка от 45 минут",
    description: "Быстрая и бережная доставка продуктов прямо до вашей двери в удобное время.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасная оплата",
    description: "Оплата онлайн картой, через СБП, SberPay, T-Pay или курьеру при получении заказа.",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-sm transition-all">
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 md:divide-x md:divide-slate-100">
        {BENEFITS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`flex items-start gap-4 transition-transform duration-200 hover:-translate-y-0.5 ${
                index > 0 ? "md:pl-6 lg:pl-8" : ""
              }`}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <Icon size={24} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
