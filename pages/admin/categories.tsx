import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AdminShell } from "../../components/admin/Sidebar";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { supabase } from "../../src/lib/supabase";

type Cat = {
  id: string;
  name: string;
  gender_target: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
};
type Sub = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
};

export default function AdminCategories() {
  const { ready } = useRequireAdmin();
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [parentId, setParentId] = useState("");
  const [catForm, setCatForm] = useState<Partial<Cat>>({ is_active: true });
  const [subForm, setSubForm] = useState<Partial<Sub>>({ is_active: true });
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [delCat, setDelCat] = useState<string | null>(null);
  const [delSub, setDelSub] = useState<string | null>(null);

  const loadCats = useCallback(async () => {
    const { data, error } = await supabase
      .from("fashion_categories")
      .select("*")
      .order("name");
    if (error) toast.error(error.message);
    else setCats((data ?? []) as Cat[]);
  }, []);

  const loadSubs = useCallback(async () => {
    let q = supabase.from("fashion_subcategories").select("*").order("name");
    if (parentId) q = q.eq("category_id", parentId);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setSubs((data ?? []) as Sub[]);
  }, [parentId]);

  useEffect(() => {
    if (ready) void loadCats();
  }, [ready, loadCats]);

  useEffect(() => {
    if (ready) void loadSubs();
  }, [ready, loadSubs]);

  const saveCat = async () => {
    if (!catForm.name || !catForm.slug) {
      toast.error("Name and slug required");
      return;
    }
    const row = {
      name: catForm.name,
      gender_target: catForm.gender_target || null,
      slug: catForm.slug,
      description: catForm.description || null,
      image_url: catForm.image_url || null,
      is_active: catForm.is_active ?? true,
    };
    if (editingCat) {
      const { error } = await supabase
        .from("fashion_categories")
        .update(row)
        .eq("id", editingCat);
      if (error) toast.error(error.message);
      else toast.success("Category updated");
    } else {
      const { error } = await supabase.from("fashion_categories").insert(row);
      if (error) toast.error(error.message);
      else toast.success("Category created");
    }
    setCatForm({ is_active: true });
    setEditingCat(null);
    void loadCats();
  };

  const saveSub = async () => {
    if (!parentId || !subForm.name || !subForm.slug) {
      toast.error("Parent, name, slug required");
      return;
    }
    const row = {
      category_id: parentId,
      name: subForm.name,
      slug: subForm.slug,
      image_url: subForm.image_url || null,
      is_active: subForm.is_active ?? true,
    };
    if (editingSub) {
      const { error } = await supabase
        .from("fashion_subcategories")
        .update(row)
        .eq("id", editingSub);
      if (error) toast.error(error.message);
      else toast.success("Subcategory updated");
    } else {
      const { error } = await supabase.from("fashion_subcategories").insert(row);
      if (error) toast.error(error.message);
      else toast.success("Subcategory created");
    }
    setSubForm({ is_active: true });
    setEditingSub(null);
    void loadSubs();
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
        <title>Admin — Categories</title>
      </Head>
      <AdminShell title="Categories">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <h3 className="text-sm font-semibold text-white">Fashion categories</h3>
            <div className="mt-4 grid gap-2 text-sm">
              <input
                placeholder="Name"
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={catForm.name ?? ""}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <select
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={catForm.gender_target ?? ""}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, gender_target: e.target.value }))
                }
              >
                <option value="">Gender target</option>
                {["male", "female", "unisex", "kids"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <input
                placeholder="Slug"
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={catForm.slug ?? ""}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
              <textarea
                placeholder="Description"
                rows={2}
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={catForm.description ?? ""}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <input
                placeholder="Image URL"
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={catForm.image_url ?? ""}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, image_url: e.target.value }))
                }
              />
              <label className="flex items-center gap-2 text-[#9ca3af]">
                <input
                  type="checkbox"
                  checked={catForm.is_active ?? true}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveCat()}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  {editingCat ? "Update" : "Add"} category
                </button>
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setCatForm({ is_active: true });
                    }}
                    className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-[#9ca3af]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <ul className="mt-6 divide-y divide-[#2a2a2a] text-sm">
              {cats.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-3 text-[#9ca3af]"
                >
                  <div>
                    <span className="font-medium text-white">{c.name}</span>{" "}
                    <span className="text-xs">({c.slug})</span>
                    <div className="text-xs capitalize">{c.gender_target}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-indigo-400"
                      onClick={() => {
                        setEditingCat(c.id);
                        setCatForm(c);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-400"
                      onClick={() => setDelCat(c.id)}
                    >
                      Del
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <h3 className="text-sm font-semibold text-white">Subcategories</h3>
            <select
              className="mt-3 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Select parent category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-4 grid gap-2 text-sm">
              <input
                placeholder="Name"
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={subForm.name ?? ""}
                onChange={(e) =>
                  setSubForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <input
                placeholder="Slug"
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={subForm.slug ?? ""}
                onChange={(e) =>
                  setSubForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
              <input
                placeholder="Image URL"
                className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                value={subForm.image_url ?? ""}
                onChange={(e) =>
                  setSubForm((f) => ({ ...f, image_url: e.target.value }))
                }
              />
              <label className="flex items-center gap-2 text-[#9ca3af]">
                <input
                  type="checkbox"
                  checked={subForm.is_active ?? true}
                  onChange={(e) =>
                    setSubForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveSub()}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  {editingSub ? "Update" : "Add"} subcategory
                </button>
                {editingSub && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSub(null);
                      setSubForm({ is_active: true });
                    }}
                    className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-[#9ca3af]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <ul className="mt-6 divide-y divide-[#2a2a2a] text-sm">
              {subs.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-3 text-[#9ca3af]"
                >
                  <span className="text-white">{s.name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-indigo-400"
                      onClick={() => {
                        setEditingSub(s.id);
                        setSubForm(s);
                        setParentId(s.category_id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-400"
                      onClick={() => setDelSub(s.id)}
                    >
                      Del
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ConfirmDialog
          open={!!delCat}
          title="Delete category?"
          message="Subcategories may be deleted by cascade."
          onCancel={() => setDelCat(null)}
          onConfirm={async () => {
            if (!delCat) return;
            const { error } = await supabase
              .from("fashion_categories")
              .delete()
              .eq("id", delCat);
            if (error) toast.error(error.message);
            else {
              toast.success("Deleted");
              setDelCat(null);
              void loadCats();
            }
          }}
        />
        <ConfirmDialog
          open={!!delSub}
          title="Delete subcategory?"
          message="This cannot be undone."
          onCancel={() => setDelSub(null)}
          onConfirm={async () => {
            if (!delSub) return;
            const { error } = await supabase
              .from("fashion_subcategories")
              .delete()
              .eq("id", delSub);
            if (error) toast.error(error.message);
            else {
              toast.success("Deleted");
              setDelSub(null);
              void loadSubs();
            }
          }}
        />
      </AdminShell>
    </>
  );
}
