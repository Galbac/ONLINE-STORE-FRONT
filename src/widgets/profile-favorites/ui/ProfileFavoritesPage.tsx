import { fallbackProfileFavorites, favoriteApi, type FavoritesResponse } from "@/entities/favorite";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileFavoritesView } from "./ProfileFavoritesView";

export const ProfileFavoritesPage = async () => {
  const favorites = await favoriteApi
    .getList({ page: 1, limit: 100 })
    .catch((): FavoritesResponse => fallbackProfileFavorites);

  return (
    <>
      <Header />
      <ProfileFavoritesView initialFavorites={favorites} />
      <Footer />
    </>
  );
};
