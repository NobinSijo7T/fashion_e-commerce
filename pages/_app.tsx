import { NextComponentType, NextPageContext } from "next";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import { IntlProvider } from "next-intl";
import { Toaster } from "react-hot-toast";

import { ProvideCart } from "../context/cart/CartProvider";
import { ProvideWishlist } from "../context/wishlist/WishlistProvider";
import { ProvideAuth } from "../context/AuthContext";

import "../styles/globals.css";
import "animate.css";
import "nprogress/nprogress.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

type AppCustomProps = {
  Component: NextComponentType<NextPageContext, any, {}>;
  pageProps: any;
  cartState: string;
  wishlistState: string;
};

const MyApp = ({ Component, pageProps }: AppCustomProps) => {
  const router = useRouter();
  const locale = pageProps.locale || router.locale || "en";
  const messages = pageProps?.messages ?? {};
  const isAdminRoute = router.pathname.startsWith("/admin");

  return (
    <IntlProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Kolkata"
    >
      <ProvideAuth>
        <ProvideWishlist>
          <ProvideCart>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{
                className: isAdminRoute
                  ? "!bg-[#141414] !text-white !border !border-[#2a2a2a]"
                  : "",
                duration: 3500,
              }}
            />
          </ProvideCart>
        </ProvideWishlist>
      </ProvideAuth>
    </IntlProvider>
  );
};

export default MyApp;
