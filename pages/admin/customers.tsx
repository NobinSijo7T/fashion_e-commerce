import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AdminShell } from "../../components/admin/Sidebar";
import { SlideOver } from "../../components/admin/SlideOver";
import { DataTable } from "../../components/admin/DataTable";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { supabase } from "../../src/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  created_at: string;
};

export default function AdminCustomers() {
  const { ready } = useRequireAdmin();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<
    { user_id: string | null; total_amount: number | null }[]
  >([]);
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<Profile | null>(null);
  const [wish, setWish] = useState<Record<string, unknown>[]>([]);
  const [addrs, setAddrs] = useState<Record<string, unknown>[]>([]);
  const [custOrders, setCustOrders] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const { data: p, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfiles((p ?? []) as Profile[]);
    const { data: o } = await supabase.from("orders").select("user_id, total_amount");
    setOrders((o ?? []) as { user_id: string | null; total_amount: number | null }[]);
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const stats = useMemo(() => {
    const m: Record<string, { n: number; s: number }> = {};
    orders.forEach((o) => {
      if (!o.user_id) return;
      if (!m[o.user_id]) m[o.user_id] = { n: 0, s: 0 };
      m[o.user_id].n += 1;
      m[o.user_id].s += Number(o.total_amount ?? 0);
    });
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const t = search.trim().toLowerCase();
    return profiles.filter(
      (p) =>
        (p.full_name ?? "").toLowerCase().includes(t) ||
        p.email.toLowerCase().includes(t)
    );
  }, [profiles, search]);

  const openPanel = async (p: Profile) => {
    setPanel(p);
    const { data: w } = await supabase
      .from("wishlist")
      .select("*, products(name)")
      .eq("user_id", p.id);
    setWish((w ?? []) as Record<string, unknown>[]);
    const { data: a } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", p.id);
    setAddrs((a ?? []) as Record<string, unknown>[]);
    const { data: co } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", p.id)
      .order("placed_at", { ascending: false });
    setCustOrders((co ?? []) as Record<string, unknown>[]);
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
        <title>Admin — Customers</title>
      </Head>
      <AdminShell title="Customers">
        <input
          placeholder="Search name or email…"
          className="mb-6 max-w-md rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DataTable>
          <thead>
            <tr className="border-b border-[#2a2a2a] text-xs uppercase text-[#9ca3af]">
              <th className="px-3 py-3 font-medium">Avatar</th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Gender</th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-3 py-3 font-medium">Orders</th>
              <th className="px-3 py-3 font-medium">Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer border-b border-[#2a2a2a] transition hover:bg-[#1f1f1f]"
                onClick={() => void openPanel(p)}
              >
                <td className="px-3 py-2">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] text-xs text-[#9ca3af]">
                      {(p.full_name ?? p.email).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-white">{p.full_name ?? "—"}</td>
                <td className="px-3 py-2">{p.email}</td>
                <td className="px-3 py-2">{p.phone ?? "—"}</td>
                <td className="px-3 py-2 capitalize">{p.gender ?? "—"}</td>
                <td className="px-3 py-2 text-xs">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">{stats[p.id]?.n ?? 0}</td>
                <td className="px-3 py-2 text-indigo-300">
                  ${(stats[p.id]?.s ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <SlideOver
          open={!!panel}
          title={panel?.full_name ?? panel?.email ?? "Customer"}
          onClose={() => setPanel(null)}
          widthClass="max-w-lg"
        >
          {panel && (
            <div className="space-y-6 text-sm text-[#9ca3af]">
              <div>
                <h4 className="font-semibold text-white">Profile</h4>
                <p className="mt-2">{panel.email}</p>
                <p>{panel.phone}</p>
                <p className="capitalize">{panel.gender}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Orders</h4>
                <ul className="mt-2 space-y-1">
                  {custOrders.map((o) => (
                    <li key={String(o.id)} className="flex justify-between">
                      <span>{String(o.order_number)}</span>
                      <span>${Number(o.total_amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white">Wishlist</h4>
                <ul className="mt-2 space-y-1">
                  {wish.map((w) => (
                    <li key={String(w.id)}>
                      {(w.products as { name?: string } | null)?.name ?? "—"}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white">Addresses</h4>
                <ul className="mt-2 space-y-2">
                  {addrs.map((a) => (
                    <li key={String(a.id)}>
                      {String(a.full_name)}, {String(a.address_line1)}, {String(a.city)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </SlideOver>
      </AdminShell>
    </>
  );
}
