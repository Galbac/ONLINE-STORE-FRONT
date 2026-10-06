import { FavoritesSkeleton } from "@/widgets/profile-favorites";
import { Footer } from "@/widgets/footer";

export default function FavoritesLoading() {
  return (
    <>
      <FavoritesSkeleton />
      <Footer />
    </>
  );
}
