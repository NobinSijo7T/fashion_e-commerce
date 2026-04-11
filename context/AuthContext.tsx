import { deleteCookie } from "cookies-next";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
} from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "../lib/supabase/client";

export type User = {
  id: string;
  email: string;
  fullname: string;
  shippingAddress?: string;
  phone?: string;
};

type authType = {
  user: User | null;
  authReady: boolean;
  register?: (
    email: string,
    fullname: string,
    password: string,
    shippingAddress: string,
    phone: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  login?: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  forgotPassword?: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  logout?: () => void;
};

const initialAuth: authType = {
  user: null,
  authReady: false,
};

const authContext = createContext<authType>(initialAuth);

export function ProvideAuth({ children }: { children: React.ReactNode }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => useContext(authContext);

function mapSupabaseUser(
  sbUser: SupabaseAuthUser,
  profile: {
    full_name: string | null;
    phone: string | null;
  } | null
): User {
  const meta = (sbUser.user_metadata || {}) as Record<string, string>;
  return {
    id: sbUser.id,
    email: sbUser.email ?? "",
    fullname:
      profile?.full_name ??
      meta.full_name ??
      meta.fullname ??
      meta.name ??
      "",
    phone: profile?.phone ?? meta.phone ?? "",
    shippingAddress: meta.shipping_address ?? "",
  };
}

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    const run = async () => {
      let supabase;
      try {
        supabase = getSupabaseBrowserClient();
      } catch {
        if (mounted) setAuthReady(true);
        return;
      }

      const hydrate = async (sbUser: SupabaseAuthUser | null) => {
        if (!sbUser) {
          setUser(null);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", sbUser.id)
          .maybeSingle();
        setUser(mapSupabaseUser(sbUser, profile));
      };

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted && session?.user) await hydrate(session.user);
      else if (mounted) setUser(null);

      if (mounted) setAuthReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {
          if (!mounted) return;
          if (nextSession?.user) await hydrate(nextSession.user);
          else setUser(null);
        }
      );
      subscription = sub.subscription;
    };

    void run();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const register = async (
    email: string,
    fullname: string,
    password: string,
    shippingAddress: string,
    phone: string
  ) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
          data: {
            full_name: fullname,
            phone,
            shipping_address: shippingAddress,
          },
        },
      });
      if (error) {
        const msg =
          error.message.toLowerCase().includes("registered") ||
          error.message.toLowerCase().includes("already")
            ? "alreadyExists"
            : "error_occurs";
        return { success: false, message: msg };
      }
      return { success: true, message: "register_successful" };
    } catch {
      return { success: false, message: "error_occurs" };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { success: false, message: "incorrect" };
      }
      return { success: true, message: "login_successful" };
    } catch {
      return { success: false, message: "incorrect" };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: origin ? `${origin}/` : undefined,
      });
      if (error) {
        return { success: false, message: "error_occurs" };
      }
      return { success: true, message: "password_reset_sent" };
    } catch {
      return { success: false, message: "error_occurs" };
    }
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setUser(null);
    deleteCookie("user");
  };

  return {
    user,
    authReady,
    register,
    login,
    forgotPassword,
    logout,
  };
}
