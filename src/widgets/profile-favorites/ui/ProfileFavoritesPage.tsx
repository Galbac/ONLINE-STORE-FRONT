import { emptyFavoritesResponse } from "@/entities/favorite";
import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { FavoritesSkeleton, ProfileFavoritesView } from "./ProfileFavoritesView";

export const ProfileFavoritesPage = () => {
  return (
    <>
      <AuthGuard fallback={<FavoritesSkeleton />}>
        <ProfileFavoritesView initialFavorites={emptyFavoritesResponse} />
      </AuthGuard>
      <Footer />
    </>
  );
};
