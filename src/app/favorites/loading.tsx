import { FavoritesSkeleton } from "@/widgets/profile-favorites";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export default function FavoritesLoading() {
  return (
    <>
      <Header />
      <FavoritesSkeleton />
      <Footer />
    </>
  );
}
