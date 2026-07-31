"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cx } from "@/lib/cx";
import type { Database } from "@/lib/types/database";

type Role = Database["public"]["Enums"]["app_role"];

const STAFF_ROLES: Role[] = ["super_admin", "executive_current"];
const AUDIT_ROLES: Role[] = ["super_admin", "executive_current", "executive_past"];

const NAV_ITEMS: { label: string; href: string; roles?: Role[] }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Directory", href: "/directory" },
  { label: "Service Charges", href: "/service-charges", roles: [...STAFF_ROLES, "accountant"] },
  { label: "Listings", href: "/property-listings", roles: STAFF_ROLES },
  { label: "Executives", href: "/executives" },
  { label: "Community", href: "/community" },
  {
    label: "Income & Expenditure",
    href: "/income-expenditure",
    roles: [...STAFF_ROLES, "accountant"],
  },
  { label: "Reports", href: "/reports" },
  { label: "Audit Log", href: "/audit-log", roles: AUDIT_ROLES },
  { label: "Users", href: "/users", roles: ["super_admin"] },
];

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
        <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
                pathname === item.href &&
                  "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
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
