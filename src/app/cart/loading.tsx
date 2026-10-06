import { CartSkeleton } from "@/widgets/cart";
import { Footer } from "@/widgets/footer";

export default function CartLoading() {
  return (
    <>
      <CartSkeleton />
      <Footer />
    </>
  );
}
