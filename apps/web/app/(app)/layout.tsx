import { NavLinks } from '@/components/layout/nav-links';
import { LogoLockup } from '@/components/layout/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-paper">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-line flex flex-col">
        <div className="h-16 flex items-center px-5">
          <LogoLockup />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLinks />
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
