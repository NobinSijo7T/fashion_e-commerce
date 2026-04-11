import React, { useState, useEffect, useMemo } from "react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import axios from "axios";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Button from "../components/Buttons/Button";
import HeroBanner from "../components/HeroBanner";
import OverlayContainer from "../components/OverlayContainer/OverlayContainer";
import Card from "../components/Card/Card";
import TestiSlider from "../components/TestiSlider/TestiSlider";
import StatsStrip from "../components/StatsStrip";
import SectionHeader from "../components/SectionHeader";
import FilterRow, { FilterCategory } from "../components/FilterRow";
import { apiProductsType, itemType } from "../context/cart/cart-types";
import LinkButton from "../components/Buttons/LinkButton";

// /bg-img/ourshop.png
import ourShop from "../public/bg-img/ourshop.png";

type Props = {
  products: itemType[];
};

const Home: React.FC<Props> = ({ products }) => {
  const t = useTranslations("Index");
  const [currentItems, setCurrentItems] = useState(products);
  const [isFetching, setIsFetching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");

  const filteredItems = useMemo(() => {
    if (activeFilter === "All") return currentItems;
    const matchers: Record<Exclude<FilterCategory, "All">, string[]> = {
      Dresses: ["dress", "gown"],
      Tops: ["top", "shirt", "tee", "blouse"],
      Bottoms: ["bottom", "pant", "jean", "short", "skirt"],
      Outerwear: ["outer", "jacket", "coat", "hoodie", "blazer"],
      Bags: ["bag"],
    };
    const keys = matchers[activeFilter];
    return currentItems.filter((p) => {
      const name = (p.category?.name ?? p.categoryName ?? "").toLowerCase();
      return keys.some((k) => name.includes(k));
    });
  }, [currentItems, activeFilter]);

  useEffect(() => {
    if (!isFetching) return;
    const fetchData = async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_PROD_BACKEND_URL}/api/v1/products?order_by=createdAt.desc&offset=${currentItems.length}&limit=10`
      );
      const fetchedProducts = res.data.data.map((product: apiProductsType) => ({
        ...product,
        img1: product.image1,
        img2: product.image2,
      }));
      setCurrentItems((products) => [...products, ...fetchedProducts]);
      setIsFetching(false);
    };
    fetchData();
  }, [isFetching, currentItems.length]);

  const handleSeemore = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsFetching(true);
  };

  return (
    <>
      {/* ===== Header Section ===== */}
      <Header />

      <HeroBanner
        highlight={
          products[0]
            ? {
                name: products[0].name,
                price: products[0].price,
                href: `/products/${encodeURIComponent(products[0].id)}`,
              }
            : null
        }
      />

      <StatsStrip />

      <main id="main-content" className="bg-white">
        {/* ===== Category Section ===== */}
        <section className="w-full h-auto border-b border-haru-border py-10">
          <div className="app-max-width app-x-padding h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="w-full sm:col-span-2 lg:col-span-2">
              <OverlayContainer
                imgSrc="/bg-img/banner_minipage1.jpg"
                imgSrc2="/bg-img/banner_minipage1-tablet.jpg"
                imgAlt="New Arrivals"
              >
                <LinkButton
                  href="/product-category/new-arrivals"
                  extraClass="absolute bottom-10-per sm:right-10-per z-20"
                >
                  {t("new_arrivals")}
                </LinkButton>
              </OverlayContainer>
            </div>
            <div className="w-full">
              <OverlayContainer
                imgSrc="/bg-img/banner_minipage2.jpg"
                imgAlt="Women Collection"
              >
                <LinkButton
                  href="/product-category/women"
                  extraClass="absolute bottom-10-per z-20"
                >
                  {t("women_collection")}
                </LinkButton>
              </OverlayContainer>
            </div>
            <div className="w-full">
              <OverlayContainer
                imgSrc="/bg-img/banner_minipage3.jpg"
                imgAlt="Men Collection"
              >
                <LinkButton
                  href="/product-category/men"
                  extraClass="absolute bottom-10-per z-20"
                >
                  {t("men_collection")}
                </LinkButton>
              </OverlayContainer>
            </div>
          </div>
        </section>

        {/* ===== Best Selling Section ===== */}
        <section className="app-max-width app-x-padding mt-16 mb-20 flex h-full w-full flex-col justify-center">
          <div className="mb-10 flex justify-center text-center">
            <div className="w-3/4 sm:w-1/2 md:w-1/3">
              <h2 className="mb-4 font-display text-3xl font-extrabold uppercase text-haru-text">
                {t("best_selling")}
              </h2>
              <span className="text-sm text-haru-muted">{t("best_selling_desc")}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 lg:gap-x-12 gap-y-6 mb-10 app-x-padding">
            {currentItems.slice(1, 5).map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* ===== Testimonial Section ===== */}
        <section className="hidden h-full w-full flex-col items-center border-y border-haru-border bg-haru-surface py-16 md:flex">
          <h2 className="font-display text-3xl font-extrabold uppercase text-haru-text">
            {t("testimonial")}
          </h2>
          <TestiSlider />
        </section>

        {/* ===== Featured Products Section ===== */}
        <section className="app-max-width app-x-padding my-16 flex flex-col">
          <SectionHeader
            title={t("featured_products")}
            seeAllHref="/product-category/new-arrivals"
          />
          <FilterRow active={activeFilter} onChange={setActiveFilter} />
          <div className="mb-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5">
            {filteredItems.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              value={!isFetching ? t("see_more") : t("loading")}
              onClick={handleSeemore}
            />
          </div>
        </section>

        <div className="border-b border-haru-border" />

        {/* ===== Our Shop Section */}
        <section className="app-max-width mt-16 mb-20 flex flex-col items-center justify-center text-center">
          <div className="textBox mb-6 w-3/4 md:w-2/4 lg:w-2/5">
            <h2 className="mb-6 font-display text-3xl font-extrabold uppercase text-haru-text">
              {t("our_shop")}
            </h2>
            <span className="w-full text-haru-muted">{t("our_shop_desc")}</span>
          </div>
          <div className="w-full app-x-padding flex justify-center">
            <Image src={ourShop} alt="Our Shop" />
          </div>
        </section>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
}) => {
  let products: itemType[] = [];
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products?order_by=createdAt.desc&limit=10`
    );
    const fetchedProducts = res.data;
    fetchedProducts.data.forEach((product: apiProductsType) => {
      products = [
        ...products,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          img1: product.image1,
          img2: product.image2,
          discountPercent: product.discountPercent,
          createdAt: product.createdAt,
          stock: product.stock,
          category: product.category,
          categoryName: product.category?.name,
        },
      ];
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }
  return {
    props: {
      locale: locale || "en",
      messages: {
        ...require(`../messages/common/${locale}.json`),
      },
      products,
    },
  };
};

export default Home;
