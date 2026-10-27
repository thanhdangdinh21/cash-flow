"use client";

import { LogoMark } from "@/components/layout/logo";
import { NavLinks } from "@/components/layout/nav-links";

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-paper">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="h-6 w-6 text-ink" />
        <span className="min-w-0 truncate text-sm font-bold tracking-tight text-ink">
          Money Flow
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <NavLinks />
      </nav>
    </aside>
  );
}
