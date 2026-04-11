import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import toast from "react-hot-toast";

import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const { loading, session, isAdmin, signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session && isAdmin) {
      void router.replace("/admin/dashboard");
    }
  }, [loading, session, isAdmin, router]);

  useEffect(() => {
    const err = router.query.error;
    if (err === "forbidden") {
      toast.error("You do not have admin access.");
    }
  }, [router.query.error]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      const { supabase } = await import("../../src/lib/supabase");
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!s?.user) {
        toast.error("Login failed.");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", s.user.id)
        .maybeSingle();
      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        toast.error("This account is not an admin.");
        return;
      }
      toast.success("Welcome back.");
      void router.replace("/admin/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login — Haru Fashion</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 font-dm">
        <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8 shadow-xl">
          <h1 className="text-center text-2xl font-semibold text-white">
            Admin Login
          </h1>
          <p className="mt-2 text-center text-sm text-[#9ca3af]">
            Sign in with your admin Supabase account
          </p>
          <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div>
              <label className="block text-xs font-medium text-[#9ca3af]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9ca3af]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
