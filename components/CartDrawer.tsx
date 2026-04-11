import { Fragment, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";

import BagIcon from "../public/icons/BagIcon";
import { useCart } from "../context/cart/CartProvider";
import { roundDecimal } from "./Util/utilFunc";
import { itemType } from "../context/cart/cart-types";

function BagOutlineEmpty() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="52"
      height="52"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9B9B9B"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

const CartDrawer: React.FC = () => {
  const t = useTranslations("CartWishlist");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState("");
  const { cart, addOne, removeItem, deleteItem } = useCart();

  let subtotal = 0;
  let noOfItems = 0;
  cart.forEach((item) => {
    noOfItems += item.qty ?? 0;
    subtotal += item.price * (item.qty ?? 0);
  });

  const shippingIsFree = subtotal >= 60;
  const shippingLabel = shippingIsFree ? t("free") : t("standard_shipping");

  const handleAnimate = useCallback(() => {
    if (noOfItems === 0) return;
    setAnimate("animate__animated animate__headShake");
  }, [noOfItems]);

  useEffect(() => {
    handleAnimate();
    const tmr = window.setTimeout(() => setAnimate(""), 1000);
    return () => window.clearTimeout(tmr);
  }, [handleAnimate, noOfItems]);

  const closeModal = () => setOpen(false);
  const openModal = () => setOpen(true);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={openModal}
          aria-label="Cart"
          className="text-haru-text"
        >
          <BagIcon extraClass="h-6 w-6" />
          {noOfItems > 0 && (
            <span
              className={`${animate} absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-haru-accent px-1 font-mono text-[10px] font-medium text-white`}
            >
              {noOfItems}
            </span>
          )}
        </button>
      </div>

      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden />
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
                  <Dialog.Panel className="pointer-events-auto flex h-full w-screen max-w-[420px] flex-col bg-white shadow-none">
                    <div className="flex items-start justify-between border-b border-haru-border px-5 py-5">
                      <div className="flex items-center gap-2">
                        <Dialog.Title className="font-display text-xl font-bold text-haru-text">
                          {t("your_bag")}
                        </Dialog.Title>
                        <span className="rounded-full bg-haru-accent px-2.5 py-0.5 font-mono text-[11px] font-medium text-white">
                          {noOfItems}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-2xl leading-none text-haru-muted hover:text-haru-text"
                        onClick={closeModal}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="flex-1 overflow-y-auto px-5 py-4">
                        {cart.length === 0 ? (
                          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-4 text-center">
                            <BagOutlineEmpty />
                            <p className="font-sans text-sm text-haru-muted">
                              {t("bag_empty")}
                            </p>
                            <Link
                              href="/product-category/new-arrivals"
                              onClick={closeModal}
                              className="rounded-full bg-haru-accent px-8 py-2.5 font-display text-sm font-bold text-white"
                            >
                              {t("start_shopping")}
                            </Link>
                          </div>
                        ) : (
                          <ul className="space-y-5">
                            {cart.map((item: itemType) => {
                              const qty = item.qty ?? 0;
                              const line = item.price * qty;
                              const variant =
                                item.categoryName ??
                                item.category?.name ??
                                "";
                              const img = item.img1 as string;
                              return (
                                <li
                                  key={item.id}
                                  className="flex gap-3 border-b border-haru-border pb-5 last:border-0"
                                >
                                  <Link
                                    href={`/products/${encodeURIComponent(
                                      item.id
                                    )}`}
                                    onClick={closeModal}
                                    className="relative h-[90px] w-[70px] shrink-0 overflow-hidden rounded-lg bg-haru-surface"
                                  >
                                    {img && (
                                      <Image
                                        src={img}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="70px"
                                      />
                                    )}
                                  </Link>
                                  <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="flex justify-between gap-2">
                                      <Link
                                        href={`/products/${encodeURIComponent(
                                          item.id
                                        )}`}
                                        onClick={closeModal}
                                        className="truncate font-sans text-[13px] font-medium text-haru-text hover:text-haru-accent"
                                      >
                                        {item.name}
                                      </Link>
                                      <button
                                        type="button"
                                        className="shrink-0 text-haru-line hover:text-haru-text"
                                        aria-label={t("remove")}
                                        onClick={() => deleteItem!(item)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    {variant && (
                                      <p className="font-mono text-[11px] text-haru-category">
                                        {variant}
                                      </p>
                                    )}
                                    <div className="mt-auto flex items-center justify-between pt-2">
                                      <div className="flex items-center border border-haru-border">
                                        <button
                                          type="button"
                                          className="px-3 py-1 font-sans text-sm hover:bg-haru-surface"
                                          onClick={() => removeItem!(item)}
                                          aria-label="Decrease quantity"
                                        >
                                          −
                                        </button>
                                        <span className="min-w-[2rem] text-center font-sans text-sm font-medium">
                                          {qty}
                                        </span>
                                        <button
                                          type="button"
                                          className="px-3 py-1 font-sans text-sm hover:bg-haru-surface"
                                          onClick={() => addOne!(item)}
                                          aria-label="Increase quantity"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <span className="font-display text-sm font-bold text-haru-text">
                                        $ {roundDecimal(line)}
                                      </span>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {cart.length > 0 && (
                        <div className="border-t border-haru-border px-5 py-5">
                          <div className="space-y-2 font-sans text-sm">
                            <div className="flex justify-between text-haru-muted">
                              <span>{t("subtotal")}</span>
                              <span className="text-haru-text">
                                $ {roundDecimal(subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-haru-muted">
                              <span>{t("delivery")}</span>
                              <span
                                className={
                                  shippingIsFree
                                    ? "font-medium text-haru-success"
                                    : "text-haru-text"
                                }
                              >
                                {shippingLabel}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-haru-border pt-3 font-display text-lg font-extrabold text-haru-text">
                              <span>{t("drawer_total")}</span>
                              <span>$ {roundDecimal(subtotal)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={cart.length < 1}
                            onClick={() => {
                              closeModal();
                              router.push("/checkout");
                            }}
                            className="mt-5 w-full rounded-full bg-haru-accent py-3 font-display text-base font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {t("checkout")}
                          </button>
                          <button
                            type="button"
                            onClick={closeModal}
                            className="mt-3 w-full text-center font-sans text-sm text-haru-muted hover:text-haru-text"
                          >
                            {t("continue_shopping")}
                          </button>
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default CartDrawer;
