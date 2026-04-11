import type { FC, ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
};

export const SlideOver: FC<Props> = ({
  open,
  title,
  onClose,
  children,
  widthClass = "max-w-xl",
}) => (
  <>
    <div
      className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
      onClick={onClose}
    />
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex w-full ${widthClass} transform border-l border-[#2a2a2a] bg-[#0f0f0f] shadow-2xl transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9ca3af] transition hover:bg-[#1a1a1a] hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </aside>
  </>
);
