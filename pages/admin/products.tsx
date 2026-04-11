import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Search } from "lucide-react";

import { AdminShell } from "../../components/admin/Sidebar";
import { DataTable } from "../../components/admin/DataTable";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { ProductEditor } from "../../components/admin/ProductEditor";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { supabase } from "../../src/lib/supabase";

type Row = {
  id: string;
  name: string;
  gender_target: string | null;
  base_price: number;
  discount_percent: number | null;
  final_price: number;
  is_active: boolean;
  fashion_categories: { name: string } | null;
  product_variants: { stock_quantity: number | null }[] | null;
  product_images: { image_url: string; is_primary: boolean | null }[] | null;
};

const PAGE = 10;

export default function AdminProducts() {
  const { ready } = useRequireAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [gender, setGender] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [delId, setDelId] = useState<string | null>(null);

  const load = useCallback(async () => {
    let q = supabase
      .from("products")
      .select(
        "id, name, gender_target, base_price, discount_percent, final_price, is_active, fashion_categories(name), product_variants(stock_quantity), product_images(image_url, is_primary)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
    if (cat) q = q.eq("category_id", cat);
    if (gender) q = q.eq("gender_target", gender);
    if (active === "true") q = q.eq("is_active", true);
    if (active === "false") q = q.eq("is_active", false);

    const from = page * PAGE;
    const { data, error, count: c } = await q.range(from, from + PAGE - 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as unknown as Row[]);
    setCount(c ?? 0);
  }, [page, search, cat, gender, active]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("fashion_categories")
        .select("id, name, slug")
        .order("name");
      setCategories((data ?? []) as { id: string; name: string; slug: string }[]);
    })();
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const stockSum = (r: Row) =>
    (r.product_variants ?? []).reduce(
      (s, v) => s + (v.stock_quantity ?? 0),
      0
    );

  const thumb = (r: Row) => {
    const imgs = [...(r.product_images ?? [])].sort(
      (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
    );
    return imgs[0]?.image_url;
  };

  const toggleActive = async (r: Row) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else void load();
  };

  const deleteProduct = async () => {
    if (!delId) return;
    const { error } = await supabase.from("products").delete().eq("id", delId);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setDelId(null);
      void load();
    }
  };

  const lastPage = Math.max(0, Math.ceil(count / PAGE) - 1);

  const filters = useMemo(
    () => (
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            placeholder="Search name…"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-2 pl-9 pr-3 text-sm text-white"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All genders</option>
          {["male", "female", "unisex", "kids"].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
          value={active}
          onChange={(e) => {
            setActive(e.target.value as "" | "true" | "false");
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setDraftId(crypto.randomUUID());
            setEditId(null);
            setEditorOpen(true);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Add product
        </button>
      </div>
    ),
    [search, cat, gender, active, categories]
  );

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
        <title>Admin — Products</title>
      </Head>
      <AdminShell title="Products">
        {filters}
        <DataTable>
          <thead>
            <tr className="border-b border-[#2a2a2a] text-xs uppercase tracking-wide text-[#9ca3af]">
              <th className="px-3 py-3 font-medium">Image</th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Gender</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Disc%</th>
              <th className="px-3 py-3 font-medium">Final</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">Active</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[#2a2a2a] transition hover:bg-[#1f1f1f]"
              >
                <td className="px-3 py-2">
                  {thumb(r) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb(r)}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-[#1a1a1a]" />
                  )}
                </td>
                <td className="px-3 py-2 text-white">{r.name}</td>
                <td className="px-3 py-2">
                  {r.fashion_categories?.name ?? "—"}
                </td>
                <td className="px-3 py-2 capitalize">{r.gender_target}</td>
                <td className="px-3 py-2">${Number(r.base_price).toFixed(2)}</td>
                <td className="px-3 py-2">{r.discount_percent ?? 0}</td>
                <td className="px-3 py-2 text-indigo-300">
                  ${Number(r.final_price).toFixed(2)}
                </td>
                <td className="px-3 py-2">{stockSum(r)}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(r)}
                    className={`rounded px-2 py-1 text-xs ${
                      r.is_active
                        ? "bg-emerald-600/20 text-emerald-300"
                        : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {r.is_active ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="p-1 text-indigo-400"
                    onClick={() => {
                      setEditId(r.id);
                      setEditorOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-red-400"
                    onClick={() => setDelId(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <div className="mt-4 flex items-center justify-between text-sm text-[#9ca3af]">
          <span>
            Page {page + 1} of {lastPage + 1 || 1} ({count} items)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              className="rounded border border-[#2a2a2a] px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= lastPage}
              className="rounded border border-[#2a2a2a] px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next
            </button>
          </div>
        </div>

        <ProductEditor
          open={editorOpen}
          productId={editId}
          draftId={draftId}
          categories={categories}
          onClose={() => {
            setEditorOpen(false);
            setEditId(null);
          }}
          onSaved={() => void load()}
        />

        <ConfirmDialog
          open={!!delId}
          title="Delete product?"
          message="This cannot be undone. Variants and images will be removed (cascade)."
          onCancel={() => setDelId(null)}
          onConfirm={() => void deleteProduct()}
        />
      </AdminShell>
    </>
  );
}
