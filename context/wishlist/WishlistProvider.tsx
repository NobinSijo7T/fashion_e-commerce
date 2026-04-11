import { useContext, useEffect, useReducer, useRef } from "react";
import { getCookie, setCookie } from "cookies-next";

import wishlistReducer from "./wishlistReducer";
import WishlistContext from "./WishlistContext";
import {
  ADD_TO_WISHLIST,
  DELETE_WISHLIST_ITEM,
  CLEAR_WISHLIST,
  itemType,
  wishlistType,
  SET_WISHLIST,
} from "./wishlist-type";
import { useAuth } from "../AuthContext";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import {
  fetchUserWishlist,
  mergeWishlists,
  replaceUserWishlistRemote,
} from "../../lib/supabase/cartWishlistDb";

export const ProvideWishlist = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value = useProvideWishlist();
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);

const useProvideWishlist = () => {
  const { user, authReady } = useAuth();
  const initPersistState: wishlistType = { wishlist: [] };
  const [state, dispatch] = useReducer(wishlistReducer, initPersistState);
  const listRef = useRef(state.wishlist);
  const mergedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    listRef.current = state.wishlist;
  }, [state.wishlist]);

  useEffect(() => {
    const initialWishlist = getCookie("wishlist");
    if (initialWishlist) {
      try {
        const wishlistItems = JSON.parse(initialWishlist as string) as itemType[];
        if (Array.isArray(wishlistItems)) {
          dispatch({ type: SET_WISHLIST, payload: wishlistItems });
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    setCookie("wishlist", state.wishlist);
  }, [state.wishlist]);

  useEffect(() => {
    if (!authReady) return;
    if (user?.id) {
      if (mergedForUserRef.current === user.id) return;
      mergedForUserRef.current = user.id;
      void (async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          const remote = await fetchUserWishlist(supabase, user.id);
          const local = listRef.current;
          const merged = mergeWishlists(local, remote);
          dispatch({ type: SET_WISHLIST, payload: merged });
          await replaceUserWishlistRemote(supabase, user.id, merged);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }
    mergedForUserRef.current = null;
    const raw = getCookie("wishlist");
    if (raw) {
      try {
        const parsed = JSON.parse(raw as string) as itemType[];
        if (Array.isArray(parsed)) {
          dispatch({ type: SET_WISHLIST, payload: parsed });
        }
      } catch {
        /* ignore */
      }
    }
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!authReady || !user?.id) return;
    const handle = window.setTimeout(() => {
      try {
        const supabase = getSupabaseBrowserClient();
        void replaceUserWishlistRemote(supabase, user.id, state.wishlist);
      } catch (e) {
        console.error(e);
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [state.wishlist, user?.id, authReady]);

  const addToWishlist = (item: itemType) => {
    dispatch({
      type: ADD_TO_WISHLIST,
      payload: item,
    });
  };

  const deleteWishlistItem = (item: itemType) => {
    dispatch({
      type: DELETE_WISHLIST_ITEM,
      payload: item,
    });
  };

  const clearWishlist = () => {
    dispatch({
      type: CLEAR_WISHLIST,
    });
  };

  const value: wishlistType = {
    wishlist: state.wishlist,
    addToWishlist,
    deleteWishlistItem,
    clearWishlist,
  };

  return value;
};
