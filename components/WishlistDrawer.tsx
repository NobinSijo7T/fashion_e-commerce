import { Fragment, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";

import { useWishlist } from "../context/wishlist/WishlistProvider";
import { useCart } from "../context/cart/CartProvider";
import { itemType } from "../context/cart/cart-types";

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-haru-muted"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" />
    </svg>
  );
}

function HeartOutlineEmpty() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9B9B9B"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M12 4.595a5.904 5.904 0 00-3.996-1.558 5.942 5.942 0 00-4.213 1.758c-2.353 2.363-2.352 6.059.002 8.412l7.332 7.332c.17.299.498.492.875.492a.99.99 0 00.792-.409l7.415-7.415c2.354-2.354 2.354-6.049-.002-8.416a5.938 5.938 0 00-4.209-1.754A5.906 5.906 0 0012 4.595z" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
};

const WishlistDrawer: React.FC<Props> = ({ open, onClose }) => {
  const t = useTranslations("CartWishlist");
  const { wishlist, deleteWishlistItem } = useWishlist();
  const { addOne } = useCart();

  const moveAllToBag = useCallback(() => {
    wishlist.forEach((item: itemType) => addOne!(item));
  }, [wishlist, addOne]);

  const count = wishlist.length;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[100]"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/30"
            aria-hidden
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto flex h-full w-screen max-w-[400px] flex-col bg-white shadow-none">
                  <div className="flex items-start justify-between border-b border-haru-border px-5 py-5">
                    <div className="flex items-center gap-2">
                      <Dialog.Title className="font-display text-xl font-bold text-haru-text">
                        {t("saved_items")}
                      </Dialog.Title>
                      <span className="rounded-full bg-haru-tag-violet px-2 py-0.5 font-mono text-[11px] font-medium text-haru-accent">
                        {count}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-2xl leading-none text-haru-muted hover:text-haru-text"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {count === 0 ? (
                      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 text-center">
                        <HeartOutlineEmpty />
                        <p className="font-mono text-sm text-haru-category">
                          {t("nothing_saved_yet")}
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {wishlist.map((item) => {
                          const cat =
                            item.categoryName ?? item.category?.name ?? "";
                          const img = item.img1 as string;
                          return (
                            <li
                              key={item.id}
                              className="flex gap-3 border-b border-haru-border pb-4 last:border-0"
                            >
                              <Link
                                href={`/products/${encodeURIComponent(item.id)}`}
                                onClick={onClose}
                                className="relative h-20 w-[60px] shrink-0 overflow-hidden rounded-lg bg-haru-surface"
                              >
                                {img && (
                                  <Image
                                    src={img}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="60px"
                                  />
                                )}
                              </Link>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/products/${encodeURIComponent(
                                    item.id
                                  )}`}
                                  onClick={onClose}
                                  className="block truncate font-sans text-[13px] font-medium text-haru-text hover:text-haru-accent"
                                >
                                  {item.name}
                                </Link>
                                <p className="font-mono text-[11px] text-haru-category">
                                  {cat}
                                </p>
                                <p className="mt-1 font-display text-sm font-bold text-haru-accent">
                                  $ {item.price.toFixed(2)}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="shrink-0 self-start p-1 hover:text-haru-hot"
                                aria-label={t("remove")}
                                onClick={() => deleteWishlistItem!(item)}
                              >
                                <TrashIcon />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {count > 0 && (
                    <div className="border-t border-haru-border p-5">
                      <button
                        type="button"
                        onClick={() => {
                          moveAllToBag();
                          onClose();
                        }}
                        className="w-full rounded-full bg-haru-accent py-3 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        {t("move_all_to_bag")}
                      </button>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default WishlistDrawer;
