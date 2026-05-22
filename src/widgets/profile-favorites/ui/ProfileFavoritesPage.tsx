import { emptyFavoritesResponse } from "@/entities/favorite";
import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileFavoritesView } from "./ProfileFavoritesView";

export const ProfileFavoritesPage = () => {
  return (
    <AuthGuard>
      <Header />
      <ProfileFavoritesView initialFavorites={emptyFavoritesResponse} />
      <Footer />
    </AuthGuard>
  );
};
