import { CartSkeleton } from "@/widgets/cart";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export default function CartLoading() {
  return (
    <>
      <Header />
      <CartSkeleton />
      <Footer />
    </>
  );
}
