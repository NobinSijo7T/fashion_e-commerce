import { FC, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

import Heart from "../public/icons/Heart";
import HeartSolid from "../public/icons/HeartSolid";
import { itemType } from "../context/cart/cart-types";
import { useCart } from "../context/cart/CartProvider";
import { useWishlist } from "../context/wishlist/WishlistProvider";

type Props = {
  item: itemType;
};

function isNewItem(createdAt?: string): boolean {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;
  const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 21;
}

const ProductCard: FC<Props> = ({ item }) => {
  const t = useTranslations("CartWishlist");
  const { wishlist, addToWishlist, deleteWishlistItem } = useWishlist();
  const { addOne } = useCart();
  const [imgHover, setImgHover] = useState(false);
  const [wlHover, setWlHover] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { id, name, price, img1, img2, discountPercent, createdAt, category } =
    item;

  const itemLink = `/products/${encodeURIComponent(id)}`;
  const categoryLabel =
    item.categoryName ?? category?.name ?? "Collection";

  const alreadyWishlisted =
    wishlist.filter((wItem) => wItem.id === id).length > 0;

  const oldPrice = useMemo(() => {
    if (!discountPercent || discountPercent <= 0) return null;
    return price / (1 - discountPercent / 100);
  }, [price, discountPercent]);

  const showSale = Boolean(discountPercent && discountPercent > 0);
  const showNew = isNewItem(createdAt) && !showSale;
  const showHot =
    typeof item.stock === "number" && item.stock > 0 && item.stock <= 8;

  const handleWishlist = () => {
    if (alreadyWishlisted) {
      deleteWishlistItem!(item);
      setJustSaved(false);
    } else {
      addToWishlist!(item);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 500);
    }
  };

  const displayImg = imgHover && img2 ? img2 : img1;

  return (
    <div className="group/card relative w-full overflow-hidden rounded-xl border border-haru-border bg-white transition-all duration-300 hover:scale-[1.01] hover:border-haru-accent">
      <div
        className="relative aspect-[3/4] bg-haru-surface"
        onMouseEnter={() => setImgHover(true)}
        onMouseLeave={() => setImgHover(false)}
      >
        <Link href={itemLink} tabIndex={-1} className="absolute inset-0 block">
          {displayImg && (
            <Image
              src={displayImg as string}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap gap-1">
          {showSale && (
            <span className="pointer-events-auto rounded-full bg-haru-hot px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-white">
              Sale
            </span>
          )}
          {showNew && (
            <span className="pointer-events-auto rounded-full bg-haru-accent px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-white">
              New
            </span>
          )}
          {showHot && !showSale && (
            <span className="pointer-events-auto rounded-full bg-haru-orange px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-white">
              Hot
            </span>
          )}
        </div>

        <button
          type="button"
          className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-haru-border bg-white transition-colors hover:border-haru-hot ${
            justSaved || alreadyWishlisted ? "haru-wishlist-saved" : ""
          }`}
          aria-label="Wishlist"
          aria-pressed={alreadyWishlisted}
          onClick={(e) => {
            e.preventDefault();
            handleWishlist();
          }}
          onMouseEnter={() => setWlHover(true)}
          onMouseLeave={() => setWlHover(false)}
        >
          <span
            className={
              wlHover || alreadyWishlisted
                ? "text-haru-hot"
                : "text-haru-line"
            }
          >
            {wlHover || alreadyWishlisted ? (
              <HeartSolid extraClass="h-5 w-5" />
            ) : (
              <Heart extraClass="h-5 w-5" />
            )}
          </span>
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full transition-transform duration-300 group-hover/card:translate-y-0">
          <button
            type="button"
            onClick={() => addOne!(item)}
            className="w-full rounded-t-none rounded-b-xl bg-haru-accent py-3 font-mono text-xs font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-95"
          >
            {t("add_to_bag")}
          </button>
        </div>
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <Link
          href={itemLink}
          className="block truncate font-sans text-[13px] font-medium text-haru-text"
        >
          {name}
        </Link>
        <p className="mt-0.5 truncate font-mono text-[11px] font-normal text-haru-category">
          {categoryLabel}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-base font-bold text-haru-text">
            $ {price.toFixed(2)}
          </span>
          {oldPrice != null && (
            <span className="font-sans text-xs font-normal text-haru-line line-through">
              $ {oldPrice.toFixed(2)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => addOne!(item)}
          className="mt-2 w-full rounded-full bg-haru-accent py-2 font-mono text-xs font-medium uppercase tracking-wide text-white lg:hidden"
        >
          {t("add_to_cart")}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
