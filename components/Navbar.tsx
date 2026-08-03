"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cx } from "@/lib/cx";
import { PAYMENT_PAGES } from "@/lib/payment-pages";
import type { Database } from "@/lib/types/database";

type Role = Database["public"]["Enums"]["app_role"];

const STAFF_ROLES: Role[] = ["super_admin", "executive_current"];
const AUDIT_ROLES: Role[] = ["super_admin", "executive_current", "executive_past"];
const PAYMENT_ROLES: Role[] = [...STAFF_ROLES, "accountant"];

type NavItem =
  | { type: "link"; label: string; href: string; roles?: Role[] }
  | { type: "dropdown"; label: string; roles?: Role[]; items: { label: string; href: string }[] };

const NAV_ITEMS: NavItem[] = [
  { type: "link", label: "Dashboard", href: "/dashboard" },
  { type: "link", label: "Directory", href: "/directory" },
  {
    type: "dropdown",
    label: "Payment",
    roles: PAYMENT_ROLES,
    items: PAYMENT_PAGES.map((p) => ({ label: p.label, href: `/payment/${p.slug}` })),
  },
  { type: "link", label: "Listings", href: "/property-listings", roles: STAFF_ROLES },
  { type: "link", label: "Executives", href: "/executives" },
  { type: "link", label: "Community", href: "/community" },
  {
    type: "link",
    label: "Income & Expenditure",
    href: "/income-expenditure",
    roles: [...STAFF_ROLES, "accountant"],
  },
  { type: "link", label: "Reports", href: "/reports" },
  { type: "link", label: "Audit Log", href: "/audit-log", roles: AUDIT_ROLES },
  { type: "link", label: "Users", href: "/users", roles: ["super_admin"] },
];

const linkClasses = (active: boolean) =>
  cx(
    "rounded px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
    active && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
  );

function NavDropdown({
  label,
  items,
  active,
  pathname,
}: {
  label: string;
  items: { label: string; href: string }[];
  active: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={linkClasses(active)}
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "block px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                pathname === item.href && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar({ fullName, role }: { fullName: string | null; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">HERA</span>
        <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {visibleItems.map((item) =>
            item.type === "dropdown" ? (
              <NavDropdown
                key={`${item.label}:${pathname}`}
                label={item.label}
                items={item.items}
                active={pathname.startsWith("/payment")}
                pathname={pathname}
              />
            ) : (
              <Link key={item.href} href={item.href} className={linkClasses(pathname === item.href)}>
                {item.label}
              </Link>
            )
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <ThemeToggle />
          <Link href="/account" className="hover:text-slate-900 dark:hover:text-slate-100">
            {fullName ?? "Unnamed"} <span className="text-xs">({role})</span>
          </Link>
          <button onClick={handleSignOut} className={buttonClasses("secondary")}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
