import type { FC, ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
};

export const StatCard: FC<Props> = ({ title, value, icon }) => (
  <div className="group relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#141414] p-5 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.12)]">
    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-[#9ca3af]">{title}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>
      </div>
      {icon && (
        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
          {icon}
        </div>
      )}
    </div>
  </div>
);
