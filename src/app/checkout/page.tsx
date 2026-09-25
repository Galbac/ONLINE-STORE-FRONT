import { Suspense } from "react";
import { CheckoutPage } from "@/widgets/checkout";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  );
}
