import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import cartReducer from "./cartReducer";
import CartContext from "./CartContext";
import { getCookie, setCookie } from "cookies-next";
import {
  ADD_ITEM,
  ADD_ONE,
  REMOVE_ITEM,
  DELETE_ITEM,
  itemType,
  cartType,
  CLEAR_CART,
  SET_CART,
} from "./cart-types";
import { useAuth } from "../AuthContext";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import {
  fetchUserCart,
  mergeCarts,
  replaceUserCartRemote,
} from "../../lib/supabase/cartWishlistDb";

export const ProvideCart = ({ children }: { children: React.ReactNode }) => {
  const value = useProvideCart();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

const useProvideCart = () => {
  const { user, authReady } = useAuth();
  const initPersistState: cartType = { cart: [] };
  const [state, dispatch] = useReducer(cartReducer, initPersistState);
  const cartRef = useRef(state.cart);
  const mergedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    cartRef.current = state.cart;
  }, [state.cart]);

  useEffect(() => {
    const initialCart = getCookie("cart");
    if (initialCart) {
      try {
        const cartItems = JSON.parse(initialCart as string) as itemType[];
        if (Array.isArray(cartItems)) {
          dispatch({ type: SET_CART, payload: cartItems });
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    setCookie("cart", state.cart);
  }, [state.cart]);

  useEffect(() => {
    if (!authReady) return;
    if (user?.id) {
      if (mergedForUserRef.current === user.id) return;
      mergedForUserRef.current = user.id;
      void (async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          const remote = await fetchUserCart(supabase, user.id);
          const local = cartRef.current;
          const merged = mergeCarts(local, remote);
          dispatch({ type: SET_CART, payload: merged });
          await replaceUserCartRemote(supabase, user.id, merged);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }
    mergedForUserRef.current = null;
    const raw = getCookie("cart");
    if (raw) {
      try {
        const parsed = JSON.parse(raw as string) as itemType[];
        if (Array.isArray(parsed)) {
          dispatch({ type: SET_CART, payload: parsed });
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
        void replaceUserCartRemote(supabase, user.id, state.cart);
      } catch (e) {
        console.error(e);
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [state.cart, user?.id, authReady]);

  const addItem = (item: itemType) => {
    dispatch({
      type: ADD_ITEM,
      payload: item,
    });
  };

  const addOne = (item: itemType) => {
    dispatch({
      type: ADD_ONE,
      payload: item,
    });
  };

  const removeItem = (item: itemType) => {
    dispatch({
      type: REMOVE_ITEM,
      payload: item,
    });
  };

  const deleteItem = (item: itemType) => {
    dispatch({
      type: DELETE_ITEM,
      payload: item,
    });
  };

  const clearCart = () => {
    dispatch({
      type: CLEAR_CART,
    });
  };

  const value: cartType = {
    cart: state.cart,
    addItem,
    addOne,
    removeItem,
    deleteItem,
    clearCart,
  };

  return value;
};
