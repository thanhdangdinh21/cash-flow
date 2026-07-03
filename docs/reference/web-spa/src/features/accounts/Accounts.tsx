import { useMemo, useState } from "react";
import { AppShell, FootA } from "../../shell/AppShell";
import { Amt, Eyebrow, Kbd } from "../../ui/bits";
import { Badge, Button, ProgressBar } from "../../ui/primitives";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import { netWorth, totalAssets, totalLiabilities } from "../../state/selectors";
import { DEMO_TODAY } from "../../data/seed";
import { money, shortDate } from "../../data/format";
import type { Account, AccountType } from "../../data/types";

const COLS = "minmax(0,1.4fr) 170px 70px 130px";
const GROUPS: AccountType[] = ["Asset", "Liability", "Income", "Expense"];

function AddLotForm({ account, onDone }: { account: Account; onDone: () => void }) {
  const { dispatch } = useStore();
  const { showToast } = useUi();
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const q = parseFloat(qty);
  const p = parseFloat(price);
  const ok = q > 0 && p > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="wa-inline-input" placeholder={`Qty (${account.unit})`} value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} autoFocus />
        <input className="wa-inline-input" placeholder="Unit price $" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" size="sm" disabled={!ok} onClick={() => {
          dispatch({ type: "ADD_LOT", accountId: account.id, qty: q, unitPrice: p, date: shortDate(DEMO_TODAY) });
          showToast(`Lot added · ${q} ${account.unit} × ${money(p)}`);
          onDone();
        }}>Add lot</Button>
        <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function AccountInspector({ account }: { account: Account }) {
  const [addingLot, setAddingLot] = useState(false);
  const isCredit = !!account.credit;

  if (account.commodity) {
    return (
      <aside className="wa-insp">
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <span className="w-chip" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--warning-soft)", color: "var(--warning)" }}><I.target size={18} /></span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 650 }}>{account.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Asset · commodity</div>
          </div>
          <span style={{ marginLeft: "auto" }}><Badge>Commodity</Badge></span>
        </div>
        <div style={{ margin: "16px 0 6px" }}>
          <Amt v={account.balance} sign={false} size={28} weight={650} style={{ letterSpacing: "-0.02em" }} />
        </div>
        <div className="wa-field"><span>Quantity</span><span className="w-amount" style={{ fontWeight: 550 }}>{account.qty} {account.unit}s</span></div>
        <div className="wa-field"><span>Average cost</span><span className="w-amount" style={{ fontWeight: 550 }}>{money(account.avgCost ?? 0)} / {account.unit?.[0] ?? "u"}</span></div>
        <div className="wa-field" style={{ borderBottom: "none" }}><span>Currency</span><span style={{ fontWeight: 550 }}>{account.currency}</span></div>
        <Eyebrow style={{ marginTop: 14, marginBottom: 4 }}>Lots</Eyebrow>
        {(account.lots ?? []).map((l, i) => (
          <div key={i} className="wa-field" style={{ fontSize: 12 }}>
            <span className="w-amount">{l.date}</span>
            <span className="w-amount" style={{ marginLeft: "auto", color: "var(--ink-2)" }}>{l.qty} {account.unit?.[0] ?? "u"} × {money(l.unit)}</span>
            <Amt v={l.total} sign={false} size={12} />
          </div>
        ))}
        {!account.lots?.length && <div style={{ fontSize: 12, color: "var(--ink-4)", padding: "8px 0" }}>No lots yet.</div>}
        <div style={{ flex: 1 }} />
        {addingLot
          ? <AddLotForm account={account} onDone={() => setAddingLot(false)} />
          : <Button variant="secondary" size="sm" block onClick={() => setAddingLot(true)}>Add lot</Button>}
      </aside>
    );
  }

  return (
    <aside className="wa-insp">
      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
        <span className="w-chip" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--paper-2)", color: "var(--ink-2)" }}>
          {isCredit ? <I.card size={18} /> : <I.wallet size={18} />}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 650 }}>{account.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{account.type}{account.sub ? ` · ${account.sub}` : account.seeded ? " · default account" : ""}</div>
        </div>
        {account.seeded && <span style={{ marginLeft: "auto" }}><Badge>Default</Badge></span>}
      </div>
      <div style={{ margin: "16px 0 6px" }}>
        <Amt v={account.balance} sign={account.balance < 0} tone={account.balance < 0 ? "neg" : ""} size={28} weight={650} style={{ letterSpacing: "-0.02em" }} />
      </div>
      {isCredit && account.credit && (
        <>
          <div style={{ margin: "4px 0 12px" }}>
            <ProgressBar value={Math.abs(account.balance)} max={account.credit.limit} tone={Math.abs(account.balance) > account.credit.limit * 0.8 ? "negative" : "warning"} />
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 6 }} className="w-amount">
              {money(Math.abs(account.balance))} of {money(account.credit.limit, { cents: false })} limit
            </div>
          </div>
          <div className="wa-field"><span>APR</span><span className="w-amount" style={{ fontWeight: 550 }}>{account.credit.apr}%</span></div>
          <div className="wa-field"><span>Statement closes</span><span style={{ fontWeight: 550 }}>{account.credit.statementDay}</span></div>
          <div className="wa-field"><span>Payment due</span><span style={{ fontWeight: 550 }}>{account.credit.dueDay}</span></div>
          <div className="wa-field"><span>Minimum payment</span><span className="w-amount" style={{ fontWeight: 550 }}>{money(account.credit.minPayment)}</span></div>
          <div className="wa-field" style={{ borderBottom: "none" }}><span>Reminder</span><span style={{ fontWeight: 550 }}>{account.credit.remind ? "3 days before due" : "Off"}</span></div>
        </>
      )}
      {!isCredit && (
        <>
          <div className="wa-field"><span>Type</span><span style={{ fontWeight: 550 }}>{account.type}</span></div>
          {account.sub && <div className="wa-field"><span>Number</span><span className="w-amount" style={{ fontWeight: 550 }}>{account.sub}</span></div>}
          <div className="wa-field" style={{ borderBottom: "none" }}><span>Currency</span><span style={{ fontWeight: 550 }}>{account.currency}</span></div>
        </>
      )}
      <div style={{ flex: 1 }} />
    </aside>
  );
}

export function Accounts() {
  const { state } = useStore();
  const { setCreateAccountOpen } = useUi();
  const [selectedId, setSelectedId] = useState("gold");

  const groups = useMemo(
    () => GROUPS.map((type) => ({ type, rows: state.accounts.filter((a) => a.type === type) })).filter((g) => g.rows.length),
    [state.accounts],
  );
  const selected = state.accounts.find((a) => a.id === selectedId) ?? state.accounts[0];
  const assets = totalAssets(state);
  const liabilities = totalLiabilities(state);
  const worth = netWorth(state);
  const subtotal = (rows: Account[]) => rows.reduce((s, a) => s + a.balance, 0);

  return (
    <AppShell
      actions={
        <>
          <Button variant="primary" size="sm" onClick={() => setCreateAccountOpen(true)}>New account</Button>
          <Kbd>A</Kbd>
        </>
      }
      bodyStyle={{ padding: 0, gap: 0, overflow: "hidden" }}
      footer={<FootA left={`${state.accounts.length} accounts · net worth ${money(worth)}`} right={<span>USD · base currency</span>} />}
    >
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, padding: "18px 16px 16px" }}>
            <div>
              <Eyebrow>Net worth</Eyebrow>
              <div style={{ marginTop: 5 }}><Amt v={worth} size={30} weight={650} style={{ letterSpacing: "-0.025em" }} /></div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 26 }}>
              <div style={{ textAlign: "right" }}>
                <Eyebrow>Assets</Eyebrow>
                <div style={{ marginTop: 4 }}><Amt v={assets} sign={false} size={16} /></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Eyebrow>Liabilities</Eyebrow>
                <div style={{ marginTop: 4 }}><Amt v={liabilities} sign={liabilities < 0} tone="neg" size={16} /></div>
              </div>
            </div>
          </div>
          <div className="wa-thead" style={{ gridTemplateColumns: COLS }}>
            <span>Account</span><span>Detail</span><span>CCY</span><span style={{ textAlign: "right" }}>Balance</span>
          </div>
          {groups.map((g) => (
            <div key={g.type}>
              <div className="wa-day">
                <span>{g.type} · {g.rows.length}</span>
                <span className="w-amount" style={{ marginLeft: "auto", letterSpacing: 0 }}>{money(subtotal(g.rows), { sign: g.type === "Liability" })}</span>
              </div>
              {g.rows.map((a) => {
                const Glyph = I[a.icon] ?? I.wallet;
                return (
                  <div key={a.id} className={"wa-tr click" + (a.id === selected?.id ? " sel" : "")} style={{ gridTemplateColumns: COLS }} onClick={() => setSelectedId(a.id)}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0, fontWeight: 600 }}>
                      <span className="w-chip" style={{ width: 24, height: 24, borderRadius: 7, background: "var(--paper-2)", color: "var(--ink-2)" }}><Glyph size={13} /></span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                      {a.seeded && <Badge>Default</Badge>}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                      {a.commodity ? `${a.qty} ${a.unit?.[0] ?? "u"} · commodity` : a.sub ?? "—"}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{a.currency}</span>
                    <Amt v={a.balance} sign={a.balance < 0} tone={a.balance < 0 ? "neg" : ""} size={13} style={{ textAlign: "right" }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {selected && <AccountInspector key={selected.id} account={selected} />}
      </div>
    </AppShell>
  );
}
