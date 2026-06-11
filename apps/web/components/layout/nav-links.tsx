"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Wallet, Settings } from "lucide-react";

export function NavLinks() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutGrid },
    { href: "/accounts", label: t("nav.accounts"), icon: Wallet },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-[120ms]",
              active
                ? "bg-press-ink text-ink"
                : "text-ink-2 hover:bg-hover-ink hover:text-ink",
            ].join(" ")}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
