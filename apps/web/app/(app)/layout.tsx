"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { Footer } from "@/components/shell/footer";
import { OverlaysProvider } from "@/components/shell/overlays-context";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";

function GlobalShortcuts() {
  useGlobalShortcuts();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OverlaysProvider>
      <GlobalShortcuts />
      <div className="flex h-screen bg-paper">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
          <Footer />
        </div>
      </div>
    </OverlaysProvider>
  );
}
