import { type FavoritesResponse } from "@/entities/favorite";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileFavoritesView } from "./ProfileFavoritesView";

const emptyFavorites: FavoritesResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 100,
  pages: 0,
};

export const ProfileFavoritesPage = () => {
  return (
    <>
      <Header />
      <ProfileFavoritesView initialFavorites={emptyFavorites} />
      <Footer />
    </>
  );
};
