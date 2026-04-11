import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";

import SearchIcon from "../../public/icons/SearchIcon";
import { itemType } from "../../context/wishlist/wishlist-type";
import Card from "../Card/Card";
import Loading from "../../public/icons/Loading";
import GhostButton from "../Buttons/GhostButton";
import { useRouter } from "next/router";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { PRODUCT_CARD_SELECT } from "../../lib/supabase/productSelect";
import {
  mapDbProductToItem,
  type DbProductRow,
} from "../../lib/supabase/mapProduct";

export default function SearchForm() {
  const t = useTranslations("Navigation");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchItems, setSearchItems] = useState<itemType[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const [moreThanFour, setMoreThanFour] = useState(false);

  function closeModal() {
    setOpen(false);
    setSearchItems([]);
    setNoResult(false);
    setMoreThanFour(false);
  }

  function openModal() {
    setOpen(true);
  }

  useEffect(() => {
    if (!isFetching) return;
    const fetchData = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const term = searchValue.trim();
        if (!term) {
          setNoResult(true);
          setSearchItems([]);
          setMoreThanFour(false);
          return;
        }
        const safe = term.replace(/%/g, "\\%").replace(/_/g, "\\_");
        const pattern = `%${safe}%`;
        const [byName, byDesc] = await Promise.all([
          supabase
            .from("products")
            .select(PRODUCT_CARD_SELECT)
            .eq("is_active", true)
            .ilike("name", pattern),
          supabase
            .from("products")
            .select(PRODUCT_CARD_SELECT)
            .eq("is_active", true)
            .ilike("description", pattern),
        ]);
        const merged = new Map<string, DbProductRow>();
        for (const row of (byName.data ?? []) as unknown as DbProductRow[]) {
          merged.set(row.id, row);
        }
        for (const row of (byDesc.data ?? []) as unknown as DbProductRow[]) {
          merged.set(row.id, row);
        }
        const list = [...merged.values()].map(mapDbProductToItem);
        if (list.length < 1) setNoResult(true);
        else setNoResult(false);
        setSearchItems(list.slice(0, 4));
        setMoreThanFour(list.length > 4);
      } catch {
        setNoResult(true);
        setSearchItems([]);
      } finally {
        setIsFetching(false);
      }
    };
    void fetchData();
  }, [isFetching, searchValue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchItems([]);
    setIsFetching(true);
  };

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setSearchValue((e.target as HTMLInputElement).value);
    setSearchItems([]);
    setNoResult(false);
    setMoreThanFour(false);
  };

  return (
    <>
      <div className="">
        <button type="button" aria-label="Search" onClick={openModal}>
          <SearchIcon />
        </button>
      </div>
      <Transition show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: 99999 }}
          static
          open={open}
          onClose={closeModal}
        >
          <div className="min-h-screen text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray500 opacity-50" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="ease-linear duration-400"
              enterFrom="-translate-y-full"
              enterTo="translate-y-0"
              leave="ease-linear duration-300"
              leaveFrom="translate-y-0"
              leaveTo="-translate-y-full"
            >
              <div className="relative translate-y inline-block w-full pt-6 pb-12 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl">
                <div className="app-max-width app-x-padding">
                  <div className="w-3/5 m-auto">
                    <div className="flex justify-end mb-8">
                      <button
                        type="button"
                        className="outline-none focus:outline-none text-2xl"
                        onClick={closeModal}
                      >
                        &#10005;
                      </button>
                    </div>
                    <form
                      className="mt-2 flex items-center"
                      onSubmit={handleSubmit}
                    >
                      {isFetching ? (
                        <Loading />
                      ) : (
                        <SearchIcon extraClass="text-gray300 w-8 h-8" />
                      )}
                      <input
                        type="search"
                        placeholder={t("search_anything")}
                        className="px-4 py-2 w-full focus:outline-none text-2xl"
                        onChange={handleChange}
                      />
                    </form>
                    <div className="border-t-2 border-gray300"></div>
                  </div>
                  {noResult ? (
                    <div className="flex justify-center mt-8">
                      <span>{t("no_result")}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div
                        className="grid gap-x-4 justify-center my-8"
                        style={{
                          gridTemplateColumns:
                            "repeat( auto-fit, minmax(120px, 170px) )",
                        }}
                      >
                        {searchItems.map((item) => (
                          <Card key={item.id} item={item} />
                        ))}
                      </div>
                      {moreThanFour && (
                        <GhostButton
                          onClick={() =>
                            router.push(`/search?q=${searchValue}`)
                          }
                        >
                          {t("view_all")}
                        </GhostButton>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
