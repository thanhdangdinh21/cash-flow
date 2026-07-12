"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  FolderOpen,
  PieChart,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "web.nav.dashboard", icon: LayoutDashboard, kbd: "G D" },
  { href: "/transactions", labelKey: "web.nav.transactions", icon: Receipt, kbd: "G T" },
  { href: "/accounts", labelKey: "web.nav.accounts", icon: Wallet, kbd: "G A" },
  { href: "/categories", labelKey: "web.nav.categories", icon: FolderOpen, kbd: "G C" },
  { href: "/reports", labelKey: "web.nav.reports", icon: PieChart, kbd: "G R" },
  { href: "/contacts", labelKey: "web.nav.contacts", icon: Users, kbd: "G M" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      {NAV_ITEMS.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={[
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms]",
              active
                ? "bg-press-ink text-ink"
                : "text-ink-2 hover:bg-hover-ink hover:text-ink",
            ].join(" ")}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            <span className="min-w-0 flex-1 truncate">{t(link.labelKey)}</span>
            <span
              className="kbd-hint eyebrow shrink-0 text-[10px] font-medium normal-case tracking-normal text-ink-4 opacity-0 group-hover:opacity-100"
              aria-hidden="true"
            >
              {link.kbd}
            </span>
          </Link>
        );
      })}
    </>
  );
}
