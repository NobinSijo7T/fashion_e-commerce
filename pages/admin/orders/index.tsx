import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

import { AdminShell } from "../../../components/admin/Sidebar";
import { DataTable } from "../../../components/admin/DataTable";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";
import { supabase } from "../../../src/lib/supabase";

type OrderRow = {
  id: string;
  order_number: string;
  total_amount: number | null;
  status: string;
  payment_status: string | null;
  placed_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  order_items: { id: string }[] | null;
};

export default function AdminOrders() {
  const { ready } = useRequireAdmin();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    let q = supabase
      .from("orders")
      .select(
        "id, order_number, total_amount, status, payment_status, placed_at, profiles(full_name, email), order_items(id)"
      )
      .order("placed_at", { ascending: false })
      .limit(200);

    if (status) q = q.eq("status", status);
    if (pay) q = q.eq("payment_status", pay);
    if (from) q = q.gte("placed_at", `${from}T00:00:00`);
    if (to) q = q.lte("placed_at", `${to}T23:59:59`);

    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      return;
    }
    let list = (data ?? []) as unknown as OrderRow[];
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(t) ||
          (o.profiles?.full_name ?? "").toLowerCase().includes(t) ||
          (o.profiles?.email ?? "").toLowerCase().includes(t)
      );
    }
    setRows(list);
  }, [status, pay, search, from, to]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const exportCsv = () => {
    const header = [
      "order_number",
      "customer",
      "items",
      "total",
      "payment_status",
      "status",
      "placed_at",
    ];
    const lines = rows.map((o) =>
      [
        o.order_number,
        `"${(o.profiles?.full_name || o.profiles?.email || "").replace(/"/g, '""')}"`,
        o.order_items?.length ?? 0,
        o.total_amount ?? "",
        o.payment_status ?? "",
        o.status,
        o.placed_at,
      ].join(",")
    );
    const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Exported");
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
        <title>Admin — Orders</title>
      </Head>
      <AdminShell title="Orders">
        <div className="mb-6 flex flex-col flex-wrap gap-3 lg:flex-row lg:items-end">
          <input
            placeholder="Order # or customer"
            className="max-w-xs rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All order statuses</option>
            {[
              "placed",
              "confirmed",
              "packed",
              "shipped",
              "out_for_delivery",
              "delivered",
              "cancelled",
              "returned",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
          >
            <option value="">All payment statuses</option>
            {["pending", "paid", "failed", "refunded"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-sm text-white hover:bg-[#1a1a1a]"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <DataTable>
          <thead>
            <tr className="border-b border-[#2a2a2a] text-xs uppercase text-[#9ca3af]">
              <th className="px-3 py-3 font-medium">Order</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Items</th>
              <th className="px-3 py-3 font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Payment</th>
              <th className="px-3 py-3 font-medium">Delivery</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                className="border-b border-[#2a2a2a] transition hover:bg-[#1f1f1f]"
              >
                <td className="px-3 py-2 font-mono text-sm text-white">
                  {o.order_number}
                </td>
                <td className="px-3 py-2 text-sm">
                  {o.profiles?.full_name || o.profiles?.email || "—"}
                </td>
                <td className="px-3 py-2">{o.order_items?.length ?? 0}</td>
                <td className="px-3 py-2 text-white">
                  ${Number(o.total_amount ?? 0).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={o.payment_status ?? "pending"} />
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-3 py-2 text-xs text-[#9ca3af]">
                  {new Date(o.placed_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-indigo-400 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </AdminShell>
    </>
  );
}
