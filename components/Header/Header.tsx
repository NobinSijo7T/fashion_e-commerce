import { useState } from "react";
import { useTranslations } from "next-intl";

import AppHeader from "./AppHeader";
import AnnouncementTicker from "../AnnouncementTicker";
import Navbar from "../Navbar";
import WishlistDrawer from "../WishlistDrawer";

type Props = {
  title?: string;
};

const Header: React.FC<Props> = ({ title }) => {
  const t = useTranslations("Navigation");
  const [wishlistOpen, setWishlistOpen] = useState(false);

  return (
    <>
      <AppHeader title={title} />

      <a
        href="#main-content"
        className="absolute left-4 z-[60] -translate-y-40 transform rounded-md bg-white px-4 py-3 opacity-90 transition-all duration-300 focus:translate-y-0 whitespace-nowrap"
      >
        {t("skip_to_main_content")}
      </a>

      <AnnouncementTicker />
      <Navbar onWishlistOpen={() => setWishlistOpen(true)} />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </>
  );
};

export default Header;
