import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export const DataTable: FC<Props> = ({ children, className = "" }) => (
  <div
    className={`overflow-x-auto rounded-xl border border-[#2a2a2a] bg-[#141414] ${className}`}
  >
    <table className="min-w-full border-collapse text-left text-sm text-[#9ca3af]">
      {children}
    </table>
  </div>
);
