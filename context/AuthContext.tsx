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

/** Structured address stored in auth metadata + `addresses` via signup trigger. */
export type RegisterAddressPayload = {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

type authType = {
  user: User | null;
  authReady: boolean;
  register?: (
    email: string,
    fullname: string,
    password: string,
    phone: string,
    address: RegisterAddressPayload
  ) => Promise<{
    success: boolean;
    message: string;
    /** Raw Supabase / network message for debugging or UI (optional). */
    detail?: string;
  }>;
  login?: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
    /** Present after a successful sign-in; used to send admins to the dashboard. */
    isAdmin?: boolean;
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
    phone: string,
    address: RegisterAddressPayload
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
            address_line1: address.address_line1,
            address_line2: address.address_line2 ?? "",
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country ?? "India",
          },
        },
      });
      if (error) {
        const raw = error.message ?? "";
        const lower = raw.toLowerCase();
        if (
          lower.includes("registered") ||
          lower.includes("already") ||
          lower.includes("user already")
        ) {
          return { success: false, message: "alreadyExists", detail: raw };
        }
        if (
          lower.includes("password") &&
          (lower.includes("weak") || lower.includes("least") || lower.includes("short"))
        ) {
          return { success: false, message: "password_too_weak", detail: raw };
        }
        if (lower.includes("invalid") && lower.includes("email")) {
          return { success: false, message: "invalid_email", detail: raw };
        }
        return { success: false, message: "error_occurs", detail: raw };
      }
      return { success: true, message: "register_successful" };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return { success: false, message: "error_occurs", detail: raw };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { success: false, message: "incorrect" };
      }
      const uid = data.user?.id;
      let isAdmin = false;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", uid)
          .maybeSingle();
        isAdmin = Boolean(profile?.is_admin);
      }
      return { success: true, message: "login_successful", isAdmin };
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
