import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AdminShell } from "../../components/admin/Sidebar";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { supabase } from "../../src/lib/supabase";

type StoreRow = {
  id: string;
  store_name: string;
  currency: string;
  free_shipping_above: number;
  contact_email: string | null;
};

export default function AdminSettings() {
  const { ready } = useRequireAdmin();
  const { user, refresh } = useAdminAuth();
  const [store, setStore] = useState<Partial<StoreRow>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");

  const loadStore = useCallback(async () => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setStore(data as StoreRow);
      return;
    }
    const { data: inserted, error: insErr } = await supabase
      .from("store_settings")
      .insert({
        store_name: "Haru Fashion",
        currency: "USD",
        free_shipping_above: 0,
        contact_email: null,
      })
      .select("*")
      .single();
    if (insErr) toast.error(insErr.message);
    else if (inserted) setStore(inserted as StoreRow);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    setFullName(data?.full_name ?? "");
    setEmail(user.email ?? "");
  }, [user]);

  useEffect(() => {
    if (ready) void loadStore();
  }, [ready, loadStore]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveStore = async () => {
    const payload = {
      store_name: store.store_name ?? "Haru Fashion",
      currency: store.currency ?? "USD",
      free_shipping_above: store.free_shipping_above ?? 0,
      contact_email: store.contact_email ?? null,
      updated_at: new Date().toISOString(),
    };
    if (store.id) {
      const { error } = await supabase
        .from("store_settings")
        .update(payload)
        .eq("id", store.id);
      if (error) toast.error(error.message);
      else toast.success("Store settings saved");
    } else {
      const { data, error } = await supabase
        .from("store_settings")
        .insert(payload)
        .select("*")
        .single();
      if (error) toast.error(error.message);
      else {
        if (data) setStore(data as StoreRow);
        toast.success("Store settings saved");
      }
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    if (pErr) {
      toast.error(pErr.message);
      return;
    }
    const updates: { email?: string; password?: string } = {};
    if (email && email !== user.email) updates.email = email;
    if (newPass) updates.password = newPass;
    if (Object.keys(updates).length) {
      const { error: aErr } = await supabase.auth.updateUser(updates);
      if (aErr) {
        toast.error(aErr.message);
        return;
      }
    }
    toast.success("Profile updated");
    setNewPass("");
    void refresh();
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#9ca3af]">
        Loading…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin — Settings</title>
      </Head>
      <AdminShell title="Settings">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
            <h3 className="text-sm font-semibold text-white">Admin profile</h3>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block text-xs text-[#9ca3af]">Display name</label>
              <input
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <label className="block text-xs text-[#9ca3af]">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="block text-xs text-[#9ca3af]">New password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Leave blank to keep"
              />
              <button
                type="button"
                onClick={() => void saveProfile()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Save profile
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
            <h3 className="text-sm font-semibold text-white">Store</h3>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block text-xs text-[#9ca3af]">Store name</label>
              <input
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={store.store_name ?? ""}
                onChange={(e) =>
                  setStore((s) => ({ ...s, store_name: e.target.value }))
                }
              />
              <label className="block text-xs text-[#9ca3af]">Currency</label>
              <input
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={store.currency ?? ""}
                onChange={(e) =>
                  setStore((s) => ({ ...s, currency: e.target.value }))
                }
              />
              <label className="block text-xs text-[#9ca3af]">
                Free shipping above
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={store.free_shipping_above ?? ""}
                onChange={(e) =>
                  setStore((s) => ({
                    ...s,
                    free_shipping_above: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <label className="block text-xs text-[#9ca3af]">Contact email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={store.contact_email ?? ""}
                onChange={(e) =>
                  setStore((s) => ({ ...s, contact_email: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => void saveStore()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Save store
              </button>
            </div>
          </div>
        </div>
      </AdminShell>
    </>
  );
}
