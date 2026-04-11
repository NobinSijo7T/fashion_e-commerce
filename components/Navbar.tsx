import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import SearchForm from "./SearchForm/SearchForm";
import AuthForm from "./Auth/AuthForm";
import UserIcon from "../public/icons/UserIcon";
import Heart from "../public/icons/Heart";
import HeartSolid from "../public/icons/HeartSolid";
import CartDrawer from "./CartDrawer";
import Menu from "./Menu/Menu";
import { useWishlist } from "../context/wishlist/WishlistProvider";

type Props = {
  onWishlistOpen: () => void;
};

const navLinkClass =
  "relative font-sans text-[12px] font-medium uppercase tracking-[0.08em] text-haru-muted transition-colors hover:text-haru-text after:pointer-events-none after:absolute after:left-1/2 after:top-[calc(100%+6px)] after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-haru-accent after:opacity-0 after:transition-opacity hover:after:opacity-100";

const Navbar: React.FC<Props> = ({ onWishlistOpen }) => {
  const t = useTranslations("Navigation");
  const { wishlist } = useWishlist();
  const count = wishlist.length;
  const [wishHover, setWishHover] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-haru-border bg-white/90 backdrop-blur-md shadow-none">
      <div className="app-max-width app-x-padding">
        <div className="flex h-[72px] items-center justify-between gap-4 lg:h-20">
          <div className="flex flex-1 items-center lg:flex-none">
            <div className="lg:hidden">
              <Menu onWishlistOpen={onWishlistOpen} />
            </div>
            <ul className="ml-6 hidden items-center gap-10 lg:flex">
              <li>
                <Link href="/product-category/men" className={navLinkClass}>
                  {t("men")}
                </Link>
              </li>
              <li>
                <Link href="/product-category/women" className={navLinkClass}>
                  {t("women")}
                </Link>
              </li>
              <li>
                <Link href="/product-category/bags" className={navLinkClass}>
                  {t("bags")}
                </Link>
              </li>
              <li>
                <Link href="/coming-soon" className={navLinkClass}>
                  {t("blogs")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0">
            <Link
              href="/"
              className="font-display text-xl font-extrabold uppercase tracking-tight text-haru-text sm:text-2xl"
            >
              <span className="text-haru-text">HAR</span>
              <span className="text-haru-accent">U</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-5 sm:gap-6 lg:gap-8">
            <Link
              href="/coming-soon"
              className="hidden rounded-full bg-haru-accent px-3 py-1.5 font-sans text-[11px] font-semibold text-white transition-opacity hover:opacity-90 md:inline-flex"
            >
              {t("drop_alert")}
            </Link>

            <ul className="flex items-center gap-4 sm:gap-5">
              <li className="hidden lg:block">
                <SearchForm />
              </li>
              <li className="hidden text-haru-text lg:block">
                <AuthForm>
                  <UserIcon />
                </AuthForm>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onWishlistOpen}
                  className="relative inline-flex text-haru-text"
                  aria-label={t("wishlist")}
                  onMouseEnter={() => setWishHover(true)}
                  onMouseLeave={() => setWishHover(false)}
                >
                  <span
                    className={
                      count > 0 || wishHover
                        ? "text-haru-hot"
                        : "text-haru-line"
                    }
                  >
                    {count > 0 || wishHover ? (
                      <HeartSolid extraClass="h-6 w-6" />
                    ) : (
                      <Heart extraClass="h-6 w-6" />
                    )}
                  </span>
                  {count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-haru-tag-violet px-1 font-mono text-[9px] font-medium text-haru-accent">
                      {count}
                    </span>
                  )}
                </button>
              </li>
              <li className="text-haru-text">
                <CartDrawer />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
