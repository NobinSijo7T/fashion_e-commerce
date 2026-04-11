import type { FC } from "react";

const statusStyles: Record<string, string> = {
  placed: "bg-zinc-600 text-white",
  confirmed: "bg-blue-600 text-white",
  packed: "bg-amber-500 text-black",
  shipped: "bg-orange-500 text-white",
  out_for_delivery: "bg-purple-600 text-white",
  delivered: "bg-emerald-600 text-white",
  cancelled: "bg-red-600 text-white",
  returned: "bg-rose-700 text-white",
  pending: "bg-zinc-600 text-white",
  paid: "bg-emerald-600 text-white",
  failed: "bg-red-600 text-white",
  refunded: "bg-violet-600 text-white",
};

type Props = {
  status: string;
  className?: string;
};

export const StatusBadge: FC<Props> = ({ status, className = "" }) => {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const cls = statusStyles[key] ?? "bg-zinc-700 text-zinc-200";
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${cls} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};
