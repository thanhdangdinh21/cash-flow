import { useEffect, useState } from "react";
import { Button, IconButton, Input, Select, Switch } from "../../ui/primitives";
import { Eyebrow } from "../../ui/bits";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import { CURRENCIES } from "../../data/seed";
import type { Account, AccountKind } from "../../data/types";

const KINDS: { id: AccountKind; icon: keyof typeof I; title: string; sub: string; accent: string }[] = [
  { id: "own", icon: "wallet", title: "Cash & bank", sub: "Track spending with wallets and bank accounts", accent: "var(--positive)" },
  { id: "owe", icon: "card", title: "Credit card", sub: "Track what you owe with credit cards", accent: "var(--negative)" },
  { id: "commodity", icon: "handCoins", title: "Commodity", sub: "Track assets like gold, crypto, stocks", accent: "var(--positive)" },
];

function parseMoney(s: string): number {
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const { showToast } = useUi();
  const [kind, setKind] = useState<AccountKind>("own");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [opening, setOpening] = useState("");
  // credit terms
  const [owed, setOwed] = useState("");
  const [limit, setLimit] = useState("5,000.00");
  const [apr, setApr] = useState("19.99");
  const [statement, setStatement] = useState("25th of the month");
  const [due, setDue] = useState("15th of the month");
  const [minPay, setMinPay] = useState("35.00");
  const [remind, setRemind] = useState(true);
  // commodity
  const [unit, setUnit] = useState("gram");
  const [qty, setQty] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = name.trim().length > 0;

  function save() {
    if (!canSave) return;
    const id = `acct-${Date.now()}`;
    const account: Account =
      kind === "owe"
        ? {
            id, name: name.trim(), type: "Liability", currency, balance: -Math.abs(parseMoney(owed)), icon: "card",
            credit: { limit: parseMoney(limit), apr: parseFloat(apr) || 0, statementDay: statement, dueDay: due, minPayment: parseMoney(minPay), remind },
          }
        : kind === "commodity"
          ? {
              id, name: name.trim(), type: "Asset", currency, balance: 0, icon: "target",
              commodity: true, unit: unit.trim() || "unit", qty: parseFloat(qty) || 0, avgCost: 0, lots: [],
            }
          : { id, name: name.trim(), type: "Asset", currency, balance: parseMoney(opening), icon: "wallet" };
    dispatch({ type: "ADD_ACCOUNT", account });
    showToast(`Account created · ${name.trim()}`);
    onClose();
  }

  const fieldGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } as const;

  return (
    <div className="w-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wb-modal" role="dialog" aria-label="Create account">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 19, fontWeight: 650, letterSpacing: "-0.015em" }}>Create account</span>
          <span style={{ flex: 1 }} />
          <IconButton label="Close" onClick={onClose}><I.x size={16} /></IconButton>
        </div>

        <Eyebrow style={{ margin: "18px 0 10px" }}>What kind of account</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {KINDS.map((k) => {
            const Glyph = I[k.icon];
            const on = kind === k.id;
            return (
              <button key={k.id} type="button" className={"w-kindtile" + (on ? " on" : "")} onClick={() => setKind(k.id)}>
                <span className="ic" style={on ? undefined : { color: k.accent }}><Glyph size={18} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="t" style={{ display: "block" }}>{k.title}</span>
                  <span className="s" style={{ display: "block" }}>{k.sub}</span>
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--font-mono)", opacity: on ? 0.72 : 0.55, flex: "none" }}>
                  Posts as {k.id === "owe" ? "Liability" : "Asset"}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ ...fieldGrid, marginTop: 18 }}>
          <Input autoFocus label="Name" placeholder={kind === "owe" ? "Sapphire card" : kind === "commodity" ? "Gold reserve" : "Travel fund"} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 0", fontSize: 12.5, color: "var(--ink-3)" }}>
          <I.lock size={13} /> Currency is locked once the account is created.
        </div>

        {kind === "own" && (
          <>
            <div style={{ marginTop: 16 }}>
              <Input label="Opening balance" prefix="$" placeholder="0.00" value={opening} onChange={(e) => setOpening(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: "var(--ink-3)" }}>
              <I.sparkle size={13} style={{ color: "var(--positive)" }} /> What&rsquo;s in the account right now.
            </div>
          </>
        )}

        {kind === "owe" && (
          <>
            <Eyebrow style={{ margin: "18px 0 10px" }}>Debt terms</Eyebrow>
            <div style={fieldGrid}>
              <Input label="Current balance owed" prefix="$" placeholder="0.00" value={owed} onChange={(e) => setOwed(e.target.value)} />
              <Input label="Credit limit" prefix="$" value={limit} onChange={(e) => setLimit(e.target.value)} />
              <Input label="Interest rate · APR" value={apr} onChange={(e) => setApr(e.target.value)} />
              <Input label="Minimum payment" prefix="$" value={minPay} onChange={(e) => setMinPay(e.target.value)} />
              <Input label="Statement closes" value={statement} onChange={(e) => setStatement(e.target.value)} />
              <Input label="Payment due" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--bg-sunken)", borderRadius: 16, padding: "13px 16px", marginTop: 14 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>Remind me before it&rsquo;s due</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>We&rsquo;ll nudge you 3 days before payment is due.</div>
              </div>
              <Switch checked={remind} onChange={setRemind} label="Payment reminder" />
            </div>
          </>
        )}

        {kind === "commodity" && (
          <>
            <Eyebrow style={{ margin: "18px 0 10px" }}>Commodity</Eyebrow>
            <div style={fieldGrid}>
              <Input label="Unit name" placeholder="gram" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input label="Initial quantity" placeholder="42.5" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-3)" }}>
              <I.swap size={13} style={{ color: "var(--positive)", flex: "none", marginTop: 2 }} />
              <span>Moving money in or out is a special transfer between this and an asset account.</span>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <Button onClick={onClose}>Cancel</Button>
          <span style={{ flex: 1 }} />
          <Button variant="primary" disabled={!canSave} onClick={save}>Create account</Button>
        </div>
      </div>
    </div>
  );
}
