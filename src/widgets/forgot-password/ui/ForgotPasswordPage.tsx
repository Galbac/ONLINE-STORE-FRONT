import Link from "next/link";
import { LockKeyhole, Mail, Send } from "lucide-react";
import { ForgotPasswordForm } from "@/features/forgot-password";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export const ForgotPasswordPage = () => {
  return (
    <>
      <Header />
      <main>
        <Container className="py-6">
          <nav className="text-text-secondary mb-24 flex items-center gap-2 text-sm md:mb-32">
            <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span>Восстановление пароля</span>
          </nav>

          <section className="mx-auto max-w-[1100px]">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <h1 className="text-text-primary text-4xl font-bold md:text-5xl">
                  Восстановление пароля
                </h1>
                <p className="text-text-secondary mt-6 text-base md:text-lg">
                  Введите email или номер телефона, указанный при регистрации.
                </p>

                <div className="mt-10">
                  <ForgotPasswordForm />
                </div>
              </div>

              <PasswordRecoveryIllustration />
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
};

const PasswordRecoveryIllustration = () => {
  return (
    <div
      className="relative hidden min-h-[390px] items-center justify-center overflow-hidden lg:flex"
      aria-hidden="true"
    >
      <div className="bg-bg-hover absolute top-8 right-7 size-80 rounded-full" />
      <Send className="text-accent-primary/20 absolute top-12 right-12 rotate-12" size={48} />
      <LockKeyhole
        className="text-accent-primary/15 absolute right-2 bottom-24 rotate-6"
        size={48}
      />
      <div className="border-accent-primary/20 absolute top-24 left-8 h-28 w-48 rounded-full border-2 border-dashed" />
      <div className="relative mt-16">
        <div className="border-border bg-bg-primary relative h-44 w-64 overflow-hidden rounded-xl border shadow-[0_24px_60px_rgb(28_43_22/0.13)]">
          <div className="border-border absolute inset-x-0 top-0 h-24 origin-top -skew-y-12 border-b bg-white" />
          <div className="border-border absolute inset-x-0 bottom-0 h-24 origin-bottom skew-y-12 border-t bg-white" />
          <Mail
            className="text-accent-primary/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            size={90}
          />
        </div>
        <div className="bg-accent-primary absolute -top-16 left-1/2 grid size-28 -translate-x-1/2 place-items-center rounded-lg text-white shadow-[0_16px_34px_rgb(21_145_13/0.25)]">
          <LockKeyhole size={62} />
        </div>
        <div className="bg-accent-primary absolute bottom-2 -left-20 h-32 w-8 rounded-full" />
        <div className="bg-accent-hover absolute bottom-4 -left-12 h-24 w-8 rotate-45 rounded-full" />
        <div className="bg-accent-primary/80 absolute bottom-20 -left-14 h-20 w-8 -rotate-45 rounded-full" />
      </div>
    </div>
  );
};
