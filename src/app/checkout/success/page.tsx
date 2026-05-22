import { CheckoutSuccessPage } from "@/widgets/checkout-success";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    order_id?: string;
    payment_id?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <CheckoutSuccessPage
      orderId={toOptionalNumber(params.order_id)}
      paymentId={toOptionalNumber(params.payment_id)}
    />
  );
}

const toOptionalNumber = (value: string | undefined): number | null => {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};
