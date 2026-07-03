import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar, Button, Switch } from "../ui/primitives";
import { Eyebrow, Kbd, Keys, LogoMark } from "../ui/bits";
import { I } from "../ui/icons";
import { useStore, SESSION_KEY } from "../state/store";
import { useUi } from "./ui-context";
import { addMonths, monthLabel } from "../data/format";
import { AddTransactionModal } from "../features/add/AddTransactionModal";
import { CommandBar } from "../features/add/CommandBar";
import { CreateAccountModal } from "../features/accounts/CreateAccountModal";

export const NAV = [
  { id: "dash", to: "/", label: "Dashboard", icon: "home", kbd: "G D", key: "d" },
  { id: "txns", to: "/transactions", label: "Transactions", icon: "receipt", kbd: "G T", key: "t" },
  { id: "accts", to: "/accounts", label: "Accounts", icon: "wallet", kbd: "G A", key: "a" },
  { id: "cats", to: "/categories", label: "Categories", icon: "folder", kbd: "G C", key: "c" },
  { id: "reports", to: "/reports", label: "Reports", icon: "pie", kbd: "G R", key: "r" },
  { id: "members", to: "/members", label: "Members", icon: "users", kbd: "G M", key: "m" },
] as const;

function isTyping(): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el as HTMLElement).isContentEditable);
}

function SettingsPopover({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const s = state.settings;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);
  const row: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };
  return (
    <div className="w-settings" ref={ref}>
      <Eyebrow>Appearance</Eyebrow>
      <div style={row}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Theme</span>
        <span className="w-seg">
          <button className={s.theme === "light" ? "on" : ""} onClick={() => dispatch({ type: "SET_SETTINGS", settings: { theme: "light" } })}>Light</button>
          <button className={s.theme === "dark" ? "on" : ""} onClick={() => dispatch({ type: "SET_SETTINGS", settings: { theme: "dark" } })}>Dark</button>
        </span>
      </div>
      <div style={row}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Table density</span>
        <span className="w-seg">
          <button className={s.density === "comfortable" ? "on" : ""} onClick={() => dispatch({ type: "SET_SETTINGS", settings: { density: "comfortable" } })}>Cozy</button>
          <button className={s.density === "compact" ? "on" : ""} onClick={() => dispatch({ type: "SET_SETTINGS", settings: { density: "compact" } })}>Compact</button>
        </span>
      </div>
      <div style={row}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Sidebar</span>
        <span className="w-seg">
          <button className={s.sidebar === "paper" ? "on" : ""} onClick={() => dispatch({ type: "SET_SETTINGS", settings: { sidebar: "paper" } })}>Paper</button>
          <button className={s.sidebar === "ink" ? "on" : ""} onClick={() => dispatch({ type: "SET_SETTINGS", settings: { sidebar: "ink" } })}>Ink</button>
        </span>
      </div>
      <div style={row}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Keyboard hints</span>
        <Switch checked={s.kbdHints} onChange={(v) => dispatch({ type: "SET_SETTINGS", settings: { kbdHints: v } })} label="Keyboard hints" />
      </div>
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", gap: 8 }}>
        <Button size="sm" onClick={() => { dispatch({ type: "RESET" }); onClose(); }}>Reset demo data</Button>
        <span style={{ flex: 1 }} />
        <Button size="sm" variant="ghost" onClick={() => { localStorage.removeItem(SESSION_KEY); navigate("/login"); }}>
          <I.logout size={14} /> Log out
        </Button>
      </div>
    </div>
  );
}

function SideA() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <aside className="wa-side">
      <div className="wa-ws">
        <LogoMark size={20} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Money flow</div>
          <div style={{ fontSize: 11, color: "var(--side-muted)", display: "flex", alignItems: "center", gap: 3 }}>
            Maya&rsquo;s money <I.chevD size={10} />
          </div>
        </div>
      </div>
      <nav className="w-nav">
        {NAV.map((n) => {
          const Glyph = I[n.icon];
          return (
            <NavLink key={n.id} to={n.to} end={n.to === "/"} className={({ isActive }) => "w-nav-it" + (isActive ? " on" : "")}>
              <Glyph size={16} />
              <span>{n.label}</span>
              <Keys k={n.kbd} style={{ marginLeft: "auto", opacity: 0.85 }} />
            </NavLink>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <div className="w-nav" style={{ position: "relative" }}>
        <div className="w-nav-it" onClick={() => setSettingsOpen((v) => !v)}>
          <I.settings size={16} />
          <span>Settings</span>
        </div>
        {settingsOpen && <SettingsPopover onClose={() => setSettingsOpen(false)} />}
      </div>
      <div className="wa-user">
        <Avatar name="Maya Chen" size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--side-fg-strong)" }}>Maya Chen</div>
          <div style={{ fontSize: 11, color: "var(--side-muted)" }}>Owner</div>
        </div>
      </div>
    </aside>
  );
}

export function MonthPager() {
  const { month, setMonth } = useUi();
  return (
    <span className="wa-pager">
      <button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month"><I.chevL size={13} style={{ opacity: 0.6 }} /></button>
      <span style={{ padding: "0 4px" }}>{monthLabel(month)}</span>
      <button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month"><I.chevR size={13} style={{ opacity: 0.6 }} /></button>
    </span>
  );
}

function TopA({ actions }: { actions?: ReactNode }) {
  const { openCmd, openAdd } = useUi();
  return (
    <div className="wa-top">
      <div className="wa-search" onClick={openCmd} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") openCmd(); }}>
        <I.search size={14} />
        <span>Search or jump to&hellip;</span>
        <span style={{ marginLeft: "auto" }}><Keys k="⌘K" /></span>
      </div>
      <div style={{ flex: 1 }} />
      {actions !== undefined ? actions : (
        <>
          <MonthPager />
          <span style={{ width: 1, height: 18, background: "var(--line)" }} />
          <Button variant="primary" size="sm" onClick={() => openAdd()}>New transaction</Button>
          <Kbd>N</Kbd>
        </>
      )}
    </div>
  );
}

export function FootA({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="wa-foot w-amount" style={{ fontWeight: 500 }}>
      <span>{left}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

export function PanelA({ title, right, children, style, bodyStyle }: {
  title?: string; right?: ReactNode; children: ReactNode; style?: CSSProperties; bodyStyle?: CSSProperties;
}) {
  return (
    <section className="wa-panel" style={style}>
      {title && (
        <header className="wa-panel-h">
          <Eyebrow>{title}</Eyebrow>
          <span style={{ flex: 1 }} />
          {right}
        </header>
      )}
      <div style={{ flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
    </section>
  );
}

export function AppShell({ actions, footer, bodyStyle, children }: {
  actions?: ReactNode;
  footer?: ReactNode;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const ui = useUi();
  const gPending = useRef(false);
  const gTimer = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ui.cmdOpen ? ui.closeCmd() : ui.openCmd();
        return;
      }
      if (isTyping() || ui.addOpen || ui.cmdOpen || ui.createAccountOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (gPending.current) {
        gPending.current = false;
        window.clearTimeout(gTimer.current);
        const target = NAV.find((n) => n.key === k);
        if (target) { e.preventDefault(); navigate(target.to); }
        return;
      }
      if (k === "g") {
        gPending.current = true;
        gTimer.current = window.setTimeout(() => { gPending.current = false; }, 900);
        return;
      }
      if (k === "n") { e.preventDefault(); ui.openAdd(); }
      else if (k === "t") { e.preventDefault(); ui.openAdd("transfer"); }
      else if (k === "a") { e.preventDefault(); ui.setCreateAccountOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, ui]);

  return (
    <div className="w-app wa">
      <SideA />
      <div className="wa-main">
        <TopA actions={actions} />
        <div className="wa-body" style={bodyStyle}>{children}</div>
        {footer}
      </div>
      {ui.cmdOpen && <CommandBar />}
      {ui.addOpen && <AddTransactionModal />}
      {ui.createAccountOpen && <CreateAccountModal onClose={() => ui.setCreateAccountOpen(false)} />}
      {ui.toast && (
        <div className="w-toast">
          <I.check size={14} /> {ui.toast}
        </div>
      )}
    </div>
  );
}
