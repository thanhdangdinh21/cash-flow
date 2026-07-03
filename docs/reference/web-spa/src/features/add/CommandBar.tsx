import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Amt, CatChip, Eyebrow, Kbd, Keys } from "../../ui/bits";
import { I, type IconComponent } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import { parseQuickAdd } from "./parser";
import { categoryPath, accountById } from "../../state/selectors";
import { DEMO_TODAY } from "../../data/seed";
import { money, nowTimeLabel } from "../../data/format";

interface NavCmd {
  id: string;
  icon: IconComponent;
  label: string;
  keys?: string;
  run: () => void;
}

export function CommandBar() {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const parsed = useMemo(() => parseQuickAdd(state, query), [state, query]);

  const navCmds = useMemo<NavCmd[]>(() => {
    const go = (to: string, label: string, icon: IconComponent, keys: string): NavCmd => ({
      id: to, icon, label, keys, run: () => { ui.closeCmd(); navigate(to); },
    });
    const all: NavCmd[] = [
      go("/transactions", "Go to transactions", I.receipt, "G T"),
      go("/reports", "Go to reports", I.pie, "G R"),
      go("/", "Go to dashboard", I.home, "G D"),
      go("/accounts", "Go to accounts", I.wallet, "G A"),
      go("/categories", "Go to categories", I.folder, "G C"),
      go("/members", "Go to members", I.users, "G M"),
      { id: "new-transfer", icon: I.swap, label: "New transfer", keys: "T", run: () => ui.openAdd("transfer") },
      { id: "new-txn", icon: I.plus, label: "New transaction", keys: "N", run: () => ui.openAdd() },
      { id: "new-account", icon: I.wallet, label: "New account", keys: "A", run: () => { ui.closeCmd(); ui.setCreateAccountOpen(true); } },
    ];
    const q = query.trim().toLowerCase();
    if (!q || parsed) return all.slice(0, 3);
    return all.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, parsed, navigate, ui]);

  /* Row model: when parsed → [add instantly, edit details, ...nav]; else nav only. */
  const rowCount = (parsed ? 2 : 0) + navCmds.length;

  useEffect(() => setSel(0), [query]);

  function addInstantly() {
    if (!parsed) return;
    dispatch({
      type: "ADD_TXN",
      txn: {
        type: parsed.income ? "income" : "expense",
        merchant: parsed.merchant,
        categoryId: parsed.category?.id,
        amount: parsed.income ? parsed.amount : -parsed.amount,
        date: DEMO_TODAY,
        time: nowTimeLabel(),
        accountId: parsed.accountId,
      },
    });
    ui.showToast(`Added ${parsed.income ? "income" : "expense"} · ${money(parsed.income ? parsed.amount : -parsed.amount, { sign: true })}`);
    ui.closeCmd();
  }

  function editDetails() {
    if (!parsed) return;
    ui.openAdd(parsed.income ? "income" : "expense", {
      merchant: parsed.merchant,
      categoryId: parsed.category?.id,
      accountId: parsed.accountId,
      amountText: parsed.amount.toFixed(2),
    });
  }

  function runRow(i: number) {
    if (parsed) {
      if (i === 0) return addInstantly();
      if (i === 1) return editDetails();
      return navCmds[i - 2]?.run();
    }
    navCmds[i]?.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); ui.closeCmd(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % Math.max(1, rowCount)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s - 1 + rowCount) % Math.max(1, rowCount)); }
    else if (e.key === "Enter") { e.preventDefault(); runRow(sel); }
    else if (e.key === "Tab" && parsed) { e.preventDefault(); editDetails(); }
  }

  const previewSub = parsed
    ? [
        parsed.income ? "Income" : "Expense",
        parsed.category ? categoryPath(state, parsed.category.id).replace(" · ", " — ") : "Global",
        `from ${accountById(state, parsed.accountId)?.name ?? ""}`,
        "today",
      ].join(" · ")
    : "";

  return (
    <div className="w-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) ui.closeCmd(); }}>
      <div className="wa-cmdk">
        <div style={{ display: "flex", alignItems: "center", gap: 11, height: 52, padding: "0 16px", borderBottom: "1px solid var(--line)" }}>
          <I.search size={16} style={{ color: "var(--ink-3)" }} />
          <input
            ref={inputRef}
            className="wa-cmdk-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type merchant, amount, @category — or search…"
            aria-label="Command bar"
          />
          <Kbd>esc</Kbd>
        </div>

        {parsed && (
          <>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12, background: "var(--paper-2)" }}>
                <CatChip cat={parsed.category} size={32} icon={16} radius={9} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 650 }}>{parsed.merchant}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{previewSub}</div>
                </div>
                <span style={{ flex: 1 }} />
                <Amt v={parsed.income ? parsed.amount : -parsed.amount} size={15} />
              </div>
            </div>
            <div className={"wa-cmdk-it" + (sel === 0 ? " on" : "")} onClick={addInstantly} onMouseEnter={() => setSel(0)}>
              <Kbd>⏎</Kbd>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>Add {parsed.income ? "income" : "expense"}</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)" }}>adds instantly</span>
            </div>
            <div className={"wa-cmdk-it" + (sel === 1 ? " on" : "")} onClick={editDetails} onMouseEnter={() => setSel(1)}>
              <Kbd>⇥</Kbd>
              <span>Edit details first</span>
            </div>
          </>
        )}

        {navCmds.length > 0 && (
          <div style={{ borderTop: parsed ? "1px solid var(--line)" : "none", padding: "9px 14px 2px" }}>
            <Eyebrow>Navigate</Eyebrow>
          </div>
        )}
        {navCmds.map((c, i) => {
          const idx = (parsed ? 2 : 0) + i;
          const Glyph = c.icon;
          return (
            <div
              key={c.id}
              className={"wa-cmdk-it" + (sel === idx ? " on" : "")}
              onClick={c.run}
              onMouseEnter={() => setSel(idx)}
              style={i === navCmds.length - 1 ? { marginBottom: 6 } : undefined}
            >
              <Glyph size={15} />
              <span>{c.label}</span>
              {c.keys && <span style={{ marginLeft: "auto" }}><Keys k={c.keys} /></span>}
            </div>
          );
        })}

        <div style={{ display: "flex", alignItems: "center", height: 36, padding: "0 16px", borderTop: "1px solid var(--line)", fontSize: 11.5, color: "var(--ink-3)" }}>
          <span>Type merchant, amount, @category — enter to add.</span>
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Keys k="↑ ↓" /> navigate</span>
        </div>
      </div>
    </div>
  );
}
