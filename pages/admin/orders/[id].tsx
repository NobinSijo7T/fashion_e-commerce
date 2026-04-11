import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AdminShell } from "../../../components/admin/Sidebar";
import { DataTable } from "../../../components/admin/DataTable";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";
import { supabase } from "../../../src/lib/supabase";

const FLOW = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

export default function AdminOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { ready } = useRequireAdmin();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [track, setTrack] = useState<Record<string, unknown> | null>(null);
  const [addr, setAddr] = useState<Record<string, unknown> | null>(null);
  const [nextStatus, setNextStatus] = useState("");

  const load = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    const { data: o, error } = await supabase
      .from("orders")
      .select("*, profiles(full_name, email, phone)")
      .eq("id", id)
      .maybeSingle();
    if (error || !o) {
      toast.error(error?.message ?? "Order not found");
      return;
    }
    setOrder(o as Record<string, unknown>);
    const shipId = (o as { shipping_address_id?: string }).shipping_address_id;
    if (shipId) {
      const { data: ad } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", shipId)
        .maybeSingle();
      setAddr((ad ?? null) as Record<string, unknown> | null);
    } else setAddr(null);

    const { data: oi } = await supabase
      .from("order_items")
      .select("*, products(product_images(image_url, is_primary))")
      .eq("order_id", id);
    setItems((oi ?? []) as Record<string, unknown>[]);

    const { data: dt } = await supabase
      .from("delivery_tracking")
      .select("*")
      .eq("order_id", id)
      .maybeSingle();
    setTrack((dt ?? null) as Record<string, unknown> | null);
    setNextStatus(
      ((dt as { current_status?: string })?.current_status ??
        (o as { status?: string }).status ??
        "placed") as string
    );

    const { data: lg } = await supabase
      .from("delivery_status_log")
      .select("*")
      .eq("order_id", id)
      .order("logged_at", { ascending: true });
    setLogs((lg ?? []) as Record<string, unknown>[]);
  }, [id]);

  useEffect(() => {
    if (ready && id) void load();
  }, [ready, id, load]);

  const applyStatus = async () => {
    if (!id || typeof id !== "string" || !nextStatus) return;
    const { error: e1 } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", id);
    if (e1) {
      toast.error(e1.message);
      return;
    }
    const { error: e2 } = await supabase
      .from("delivery_tracking")
      .upsert(
        {
          order_id: id,
          current_status: nextStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" }
      );
    if (e2) {
      toast.error(e2.message);
      return;
    }
    const { error: e3 } = await supabase.from("delivery_status_log").insert({
      order_id: id,
      status: nextStatus,
      message: `Status set to ${nextStatus}`,
      logged_at: new Date().toISOString(),
    });
    if (e3) toast.error(e3.message);
    else {
      toast.success("Status updated");
      void load();
    }
  };

  if (!ready || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#9ca3af]">
        Loading…
      </div>
    );
  }

  const prof = (order?.profiles ?? null) as Record<string, string> | null;
  const o = order as {
    order_number?: string;
    payment_method?: string;
    payment_status?: string;
    total_amount?: number;
  } | null;

  return (
    <>
      <Head>
        <title>Order {o?.order_number}</title>
      </Head>
      <AdminShell title={`Order ${o?.order_number ?? ""}`}>
        <Link
          href="/admin/orders"
          className="mb-6 inline-block text-sm text-indigo-400 hover:underline"
        >
          ← Back to orders
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <h3 className="text-sm font-semibold text-white">Customer</h3>
            <p className="mt-2 text-sm text-[#9ca3af]">
              {prof?.full_name}
              <br />
              {prof?.email}
              <br />
              {prof?.phone}
            </p>
            <h3 className="mt-4 text-sm font-semibold text-white">Shipping</h3>
            <p className="mt-2 text-sm text-[#9ca3af]">
              {addr
                ? `${addr.full_name}, ${addr.address_line1}, ${addr.city}, ${addr.state} ${addr.pincode}`
                : "—"}
            </p>
            <h3 className="mt-4 text-sm font-semibold text-white">Payment</h3>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Method: {o?.payment_method ?? "—"}
              <br />
              Status: <StatusBadge status={String(o?.payment_status ?? "")} />
            </p>
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <h3 className="text-sm font-semibold text-white">Update delivery</h3>
            <p className="mt-2 text-xs text-[#9ca3af]">
              Current:{" "}
              <StatusBadge
                status={String(
                  (track as { current_status?: string })?.current_status ??
                    (order as { status?: string })?.status ??
                    ""
                )}
              />
            </p>
            <select
              className="mt-3 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              {FLOW.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void applyStatus()}
              className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white"
            >
              Apply status
            </button>
            <h3 className="mt-6 text-sm font-semibold text-white">Timeline</h3>
            <ol className="mt-3 space-y-3 border-l border-[#2a2a2a] pl-4">
              {logs.map((l) => (
                <li key={String(l.id)} className="relative text-sm text-[#9ca3af]">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-indigo-500" />
                  <StatusBadge status={String(l.status)} />
                  <div className="text-xs">{String(l.message)}</div>
                  <div className="text-xs opacity-70">
                    {new Date(String(l.logged_at)).toLocaleString()}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <h3 className="mb-3 mt-8 text-sm font-semibold text-white">Items</h3>
        <DataTable>
          <thead>
            <tr className="border-b border-[#2a2a2a] text-xs text-[#9ca3af]">
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const p = it.products as
                | { product_images?: { image_url: string }[] }
                | undefined;
              const img = p?.product_images?.[0]?.image_url;
              return (
                <tr
                  key={String(it.id)}
                  className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f]"
                >
                  <td className="px-3 py-2">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[#1a1a1a]" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-white">{String(it.product_name)}</td>
                  <td className="px-3 py-2">{String(it.size)}</td>
                  <td className="px-3 py-2">{String(it.color)}</td>
                  <td className="px-3 py-2">{String(it.quantity)}</td>
                  <td className="px-3 py-2">
                    ${Number(it.unit_price).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </AdminShell>
    </>
  );
}
