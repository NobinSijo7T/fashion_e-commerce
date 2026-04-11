import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import toast from "react-hot-toast";

import { AdminShell } from "../../components/admin/Sidebar";
import { StatCard } from "../../components/admin/StatCard";
import { DataTable } from "../../components/admin/DataTable";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { supabase } from "../../src/lib/supabase";

type OrderRow = {
  id: string;
  order_number: string;
  total_amount: number | null;
  status: string;
  placed_at: string;
  profiles: { full_name: string | null; email: string } | null;
};

type LowStockRow = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number | null;
  products: { name: string } | null;
};

export default function AdminDashboard() {
  const { ready } = useRequireAdmin();
  const [revenue, setRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [chartOrders, setChartOrders] = useState<{ date: string; count: number }[]>([]);
  const [chartRev, setChartRev] = useState<{ date: string; revenue: number }[]>([]);
  const [recent, setRecent] = useState<OrderRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);

  const load = useCallback(async () => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();

      const { data: paidOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid");

      const rev =
        paidOrders?.reduce(
          (s, o) => s + Number(o.total_amount ?? 0),
          0
        ) ?? 0;
      setRevenue(rev);

      const { count: oc } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });
      setOrderCount(oc ?? 0);

      const { count: pc } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      setProductCount(pc ?? 0);

      const { count: cc } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      setCustomerCount(cc ?? 0);

      const { data: orders30 } = await supabase
        .from("orders")
        .select("placed_at, total_amount, payment_status")
        .gte("placed_at", sinceIso);

      const byDay: Record<string, { count: number; revenue: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const key = d.toISOString().slice(0, 10);
        byDay[key] = { count: 0, revenue: 0 };
      }
      (orders30 ?? []).forEach((o) => {
        const key = (o.placed_at as string).slice(0, 10);
        if (!byDay[key]) byDay[key] = { count: 0, revenue: 0 };
        byDay[key].count += 1;
        if (o.payment_status === "paid") {
          byDay[key].revenue += Number(o.total_amount ?? 0);
        }
      });
      const keys = Object.keys(byDay).sort();
      setChartOrders(keys.map((k) => ({ date: k.slice(5), count: byDay[k].count })));
      setChartRev(
        keys.map((k) => ({ date: k.slice(5), revenue: byDay[k].revenue }))
      );

      const { data: recentRows } = await supabase
        .from("orders")
        .select(
          "id, order_number, total_amount, status, placed_at, profiles(full_name, email)"
        )
        .order("placed_at", { ascending: false })
        .limit(10);
      setRecent((recentRows ?? []) as unknown as OrderRow[]);

      const { data: low } = await supabase
        .from("product_variants")
        .select("id, size, color, stock_quantity, products(name)")
        .lt("stock_quantity", 5)
        .order("stock_quantity", { ascending: true })
        .limit(20);
      setLowStock((low ?? []) as unknown as LowStockRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

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
        <title>Admin Dashboard</title>
      </Head>
      <AdminShell title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total revenue (paid)"
            value={`$${revenue.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Total orders"
            value={orderCount}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <StatCard
            title="Products"
            value={productCount}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Customers"
            value={customerCount}
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <h3 className="mb-4 text-sm font-semibold text-white">
              Orders per day (30d)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartOrders}>
                  <CartesianGrid stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <h3 className="mb-4 text-sm font-semibold text-white">
              Revenue per day (30d, paid)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRev}>
                  <CartesianGrid stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              Recent orders
            </h3>
            <DataTable>
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs uppercase tracking-wide text-[#9ca3af]">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[#2a2a2a] transition hover:bg-[#1f1f1f]"
                  >
                    <td className="px-4 py-3 text-white">{o.order_number}</td>
                    <td className="px-4 py-3">
                      {o.profiles?.full_name || o.profiles?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-white">
                      ${Number(o.total_amount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9ca3af]">
                      {new Date(o.placed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              Low stock (&lt; 5)
            </h3>
            <DataTable>
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs uppercase tracking-wide text-[#9ca3af]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Color</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#2a2a2a] transition hover:bg-[#1f1f1f]"
                  >
                    <td className="px-4 py-3 text-white">
                      {r.products?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{r.size}</td>
                    <td className="px-4 py-3">{r.color}</td>
                    <td className="px-4 py-3 text-amber-400">
                      {r.stock_quantity ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </div>
      </AdminShell>
    </>
  );
}
