import { orderApi } from "@/entities/order";
import { paymentApi } from "@/entities/payment";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CheckoutSuccessView } from "./CheckoutSuccessView";

interface CheckoutSuccessPageProps {
  orderId: number | null;
  paymentId: number | null;
}

export const CheckoutSuccessPage = async ({ orderId, paymentId }: CheckoutSuccessPageProps) => {
  if (!orderId || !paymentId) {
    return (
      <>
        <Header />
        <main className="bg-bg-primary min-h-[70vh]">
          <Container className="py-10 md:py-14">
            <section className="border-border bg-bg-primary shadow-soft max-w-2xl rounded-lg border p-6 md:p-9">
              <h1 className="text-text-primary text-3xl font-bold">Заказ не выбран</h1>
              <p className="text-text-secondary mt-4 leading-7">
                Откройте страницу из истории заказов или вернитесь в каталог.
              </p>
            </section>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const [order, status, payment] = await Promise.all([
    orderApi.getById(orderId),
    orderApi.getStatus(orderId),
    paymentApi.getById(paymentId),
  ]);

  return (
    <>
      <Header />
      <CheckoutSuccessView order={order} payment={payment} status={status} />
      <Footer />
    </>
  );
};
