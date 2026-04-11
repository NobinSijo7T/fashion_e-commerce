import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Trash2 } from "lucide-react";

import { AdminShell } from "../../components/admin/Sidebar";
import { DataTable } from "../../components/admin/DataTable";
import { SlideOver } from "../../components/admin/SlideOver";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { supabase } from "../../src/lib/supabase";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | null;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
};

export default function AdminCoupons() {
  const { ready } = useRequireAdmin();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Coupon>>({ is_active: true });
  const [delId, setDelId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("code", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Coupon[]);
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const genCode = () => {
    const c = `SAVE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setForm((f) => ({ ...f, code: c }));
  };

  const save = async () => {
    if (!form.code || !form.discount_type) {
      toast.error("Code and type required");
      return;
    }
    const row = {
      code: form.code,
      discount_type: form.discount_type,
      discount_value: form.discount_value ?? 0,
      min_order_value: form.min_order_value ?? 0,
      max_uses: form.max_uses ?? null,
      used_count: form.used_count ?? 0,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active ?? true,
    };
    if (editId) {
      const { error } = await supabase.from("coupons").update(row).eq("id", editId);
      if (error) toast.error(error.message);
      else toast.success("Updated");
    } else {
      const { error } = await supabase.from("coupons").insert(row);
      if (error) toast.error(error.message);
      else toast.success("Created");
    }
    setOpen(false);
    setEditId(null);
    setForm({ is_active: true });
    void load();
  };

  const copy = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Copied");
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
        <title>Admin — Coupons</title>
      </Head>
      <AdminShell title="Coupons">
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm({ is_active: true, discount_type: "percent" });
            setOpen(true);
          }}
          className="mb-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Add coupon
        </button>
        <DataTable>
          <thead>
            <tr className="border-b border-[#2a2a2a] text-xs uppercase text-[#9ca3af]">
              <th className="px-3 py-3 font-medium">Code</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Value</th>
              <th className="px-3 py-3 font-medium">Min order</th>
              <th className="px-3 py-3 font-medium">Max uses</th>
              <th className="px-3 py-3 font-medium">Used</th>
              <th className="px-3 py-3 font-medium">Valid until</th>
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
                <td className="px-3 py-2 font-mono text-white">{r.code}</td>
                <td className="px-3 py-2">{r.discount_type}</td>
                <td className="px-3 py-2">{r.discount_value}</td>
                <td className="px-3 py-2">{r.min_order_value}</td>
                <td className="px-3 py-2">{r.max_uses ?? "—"}</td>
                <td className="px-3 py-2">{r.used_count ?? 0}</td>
                <td className="px-3 py-2 text-xs">
                  {r.valid_until
                    ? new Date(r.valid_until).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-3 py-2">{r.is_active ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="p-1 text-indigo-400"
                    onClick={() => copy(r.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-indigo-400"
                    onClick={() => {
                      setEditId(r.id);
                      setForm(r);
                      setOpen(true);
                    }}
                  >
                    Edit
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

        <SlideOver
          open={open}
          title={editId ? "Edit coupon" : "New coupon"}
          onClose={() => {
            setOpen(false);
            setEditId(null);
          }}
        >
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="Code"
                value={form.code ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
              <button
                type="button"
                onClick={genCode}
                className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-indigo-400"
              >
                Generate
              </button>
            </div>
            <select
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
              value={form.discount_type ?? "percent"}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount_type: e.target.value }))
              }
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Discount value"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
              value={form.discount_value ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discount_value: parseFloat(e.target.value) || 0,
                }))
              }
            />
            <input
              type="number"
              step="0.01"
              placeholder="Min order value"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
              value={form.min_order_value ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  min_order_value: parseFloat(e.target.value) || 0,
                }))
              }
            />
            <input
              type="number"
              placeholder="Max uses (optional)"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
              value={form.max_uses ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  max_uses: e.target.value ? parseInt(e.target.value, 10) : null,
                }))
              }
            />
            <label className="block text-xs text-[#9ca3af]">Valid from</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
              value={form.valid_from?.slice(0, 16) ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  valid_from: e.target.value ? `${e.target.value}:00` : null,
                }))
              }
            />
            <label className="block text-xs text-[#9ca3af]">Valid until</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-white"
              value={form.valid_until?.slice(0, 16) ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  valid_until: e.target.value ? `${e.target.value}:00` : null,
                }))
              }
            />
            <label className="flex items-center gap-2 text-[#9ca3af]">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              Active
            </label>
            <button
              type="button"
              onClick={() => void save()}
              className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white"
            >
              Save
            </button>
          </div>
        </SlideOver>

        <ConfirmDialog
          open={!!delId}
          title="Delete coupon?"
          message="This cannot be undone."
          onCancel={() => setDelId(null)}
          onConfirm={async () => {
            if (!delId) return;
            const { error } = await supabase.from("coupons").delete().eq("id", delId);
            if (error) toast.error(error.message);
            else {
              toast.success("Deleted");
              setDelId(null);
              void load();
            }
          }}
        />
      </AdminShell>
    </>
  );
}
