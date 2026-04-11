import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Star } from "lucide-react";

import { AdminShell } from "../../components/admin/Sidebar";
import { DataTable } from "../../components/admin/DataTable";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { supabase } from "../../src/lib/supabase";

type Row = {
  id: string;
  rating: number | null;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  products: { name: string } | null;
  profiles: { full_name: string | null; email: string } | null;
};

export default function AdminReviews() {
  const { ready } = useRequireAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [rating, setRating] = useState("");
  const [delId, setDelId] = useState<string | null>(null);

  const load = useCallback(async () => {
    let q = supabase
      .from("reviews")
      .select("*, products(name), profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (rating) q = q.eq("rating", parseInt(rating, 10));
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data ?? []) as unknown as Row[]);
  }, [rating]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const toggleFeatured = async (r: Row) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_featured: !r.is_featured })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else void load();
  };

  const del = async () => {
    if (!delId) return;
    const { error } = await supabase.from("reviews").delete().eq("id", delId);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setDelId(null);
      void load();
    }
  };

  const stars = (n: number | null) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`inline h-4 w-4 ${
          i < (n ?? 0) ? "fill-amber-400 text-amber-400" : "text-zinc-600"
        }`}
      />
    ));

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
        <title>Admin — Reviews</title>
      </Head>
      <AdminShell title="Reviews">
        <select
          className="mb-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          <option value="">All ratings</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {n} stars
            </option>
          ))}
        </select>
        <DataTable>
          <thead>
            <tr className="border-b border-[#2a2a2a] text-xs uppercase text-[#9ca3af]">
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Rating</th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Body</th>
              <th className="px-3 py-3 font-medium">Verified</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[#2a2a2a] transition hover:bg-[#1f1f1f]"
              >
                <td className="px-3 py-2 text-white">
                  {r.products?.name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {r.profiles?.full_name || r.profiles?.email}
                </td>
                <td className="px-3 py-2">{stars(r.rating)}</td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="max-w-xs truncate px-3 py-2">{r.body}</td>
                <td className="px-3 py-2">
                  {r.is_verified_purchase ? "Yes" : "No"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="mr-2 text-xs text-indigo-400"
                    onClick={() => void toggleFeatured(r)}
                  >
                    {r.is_featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    className="text-red-400"
                    onClick={() => setDelId(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        <ConfirmDialog
          open={!!delId}
          title="Delete review?"
          message="This cannot be undone."
          onCancel={() => setDelId(null)}
          onConfirm={() => void del()}
        />
      </AdminShell>
    </>
  );
}
