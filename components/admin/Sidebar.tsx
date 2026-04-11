import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FC } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Star,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useAdminAuth } from "../../hooks/useAdminAuth";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const AdminSidebar: FC = () => {
  const router = useRouter();
  const path = router.pathname;
  const { signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);

  const linkCls = (href: string) => {
    const active = path === href || (href !== "/admin/dashboard" && path.startsWith(href));
    return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      active
        ? "border-l-2 border-indigo-500 bg-indigo-500/10 text-white"
        : "border-l-2 border-transparent text-[#9ca3af] hover:bg-[#1a1a1a] hover:text-white"
    }`;
  };

  const NavLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={linkCls(href)}
          onClick={() => setOpen(false)}
        >
          <Icon className="h-5 w-5 shrink-0 text-indigo-400" />
          {label}
        </Link>
      ))}
      <div className="mt-auto border-t border-[#2a2a2a] pt-4">
        <button
          type="button"
          onClick={() => void signOut().then(() => router.push("/admin/login"))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9ca3af] transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] text-white lg:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r border-[#2a2a2a] bg-[#0f0f0f] transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-[#2a2a2a] px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">
            Haru Admin
          </p>
          <p className="mt-1 text-lg font-semibold text-white">Dashboard</p>
        </div>
        {NavLinks}
      </aside>
    </>
  );
};

export const AdminShell: FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => (
  <div className="min-h-screen bg-[#0a0a0a] font-dm text-white">
    <AdminSidebar />
    <main className="lg:pl-64">
      <div className="border-b border-[#2a2a2a] px-4 py-6 pt-16 lg:pt-6 lg:pl-8">
        {title && (
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        )}
      </div>
      <div className="px-4 py-6 lg:px-8">{children}</div>
    </main>
  </div>
);
