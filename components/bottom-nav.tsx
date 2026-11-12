"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  ChartColumn,
  House,
  ScanBarcode,
  Search,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { isNavItemActive } from "@/lib/navigation";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "היום", icon: House },
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/scan", label: "סריקה", icon: ScanBarcode },
  { href: "/meals", label: "ארוחות", icon: UtensilsCrossed },
  { href: "/stats", label: "סטטיסטיקה", icon: ChartColumn },
];

export function BottomNav() {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10"
    >
      {/* Dynamic routes (e.g. /food/[id]) only know their path at request time,
          so the links prerender unhighlighted and the active tab streams in. */}
      <Suspense fallback={<NavItems pathname={null} />}>
        <ActiveNavItems />
      </Suspense>
    </nav>
  );
}

const ActiveNavItems = () => <NavItems pathname={usePathname()} />;

const NavItems = ({ pathname }: { pathname: string | null }) => (
  <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
      const active = pathname !== null && isNavItemActive(pathname, href);
      const isScan = href === "/scan";

      return (
        <li key={href} className="flex-1">
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              active ? "text-brand" : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <span
              className={
                isScan
                  ? "-mt-6 flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg"
                  : "flex size-6 items-center justify-center"
              }
            >
              <Icon aria-hidden className={isScan ? "size-6" : "size-5"} />
            </span>
            {label}
          </Link>
        </li>
      );
    })}
  </ul>
);
