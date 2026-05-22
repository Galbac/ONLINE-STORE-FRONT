import { cartApi, fallbackCart, fallbackCartSummary } from "@/entities/cart";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CartView } from "./CartView";

export const CartPage = async () => {
  const [cart, summary] = await Promise.all([
    cartApi.get().catch(() => fallbackCart),
    cartApi.getSummary().catch(() => fallbackCartSummary),
  ]);

  return (
    <>
      <Header />
      <CartView initialCart={cart} initialSummary={summary} />
      <Footer />
    </>
  );
};
