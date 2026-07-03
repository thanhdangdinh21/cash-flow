import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, PanelA } from "../../shell/AppShell";
import { Amt, CatChip, Eyebrow, Keys } from "../../ui/bits";
import { Badge, Button, ProgressBar } from "../../ui/primitives";
import { WBars } from "../../ui/charts";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import {
  bankAccounts, budgetRows, categoryPath, monthIncome, monthSpent,
  monthTxns, topCategory, unbudgetedPrompt, weeklyCashflow, accountById,
} from "../../state/selectors";
import { money, monthLabel } from "../../data/format";
import type { BudgetRow } from "../../state/selectors";

function AStat({ label, value, sub, tone }: { label: string; value: number; sub: string; tone?: "pos" }) {
  return (
    <div className="wa-panel" style={{ padding: "13px 16px 12px", gap: 3 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 5 }}>
        <Amt v={value} sign={tone === "pos"} tone={tone === "pos" ? "pos" : ""} size={25} weight={650} style={{ letterSpacing: "-0.02em" }} />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function ABudgetRow({ b, editing, onLimit }: { b: BudgetRow; editing: boolean; onLimit: (limit: number) => void }) {
  return (
    <div style={{ padding: "11px 14px 12px", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</span>
        <span style={{ flex: 1 }} />
        {editing ? (
          <input
            className="wa-inline-input w-amount"
            style={{ width: 90, height: 26, textAlign: "right" }}
            defaultValue={b.limit}
            onBlur={(e) => { const v = parseFloat(e.target.value); if (v > 0) onLimit(v); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            aria-label={`${b.label} budget limit`}
          />
        ) : b.over
          ? <Badge tone="negative">Over by {money(b.spent - b.limit, { cents: false })}</Badge>
          : <span className="w-amount" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{money(b.spent, { cents: false })} of {money(b.limit, { cents: false })}</span>}
      </div>
      <ProgressBar value={Math.min(b.spent, b.limit)} max={b.limit} tone={b.over ? "negative" : "positive"} />
    </div>
  );
}

export function Dashboard() {
  const { state, dispatch } = useStore();
  const { month, showToast } = useUi();
  const [editingBudgets, setEditingBudgets] = useState(false);

  const banks = bankAccounts(state);
  const bankTotal = banks.reduce((s, a) => s + a.balance, 0);
  const income = monthIncome(state, month);
  const spent = monthSpent(state, month);
  const budgets = budgetRows(state, month);
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const net = Math.round((income - spent) * 100) / 100;
  const keptPct = income > 0 ? Math.round((net / income) * 100) : 0;
  const weeks = weeklyCashflow(state, month);
  const prompt = unbudgetedPrompt(state, month);
  const txns = monthTxns(state, month);
  const deposits = txns.filter((t) => t.type === "income").length;
  const monthShort = monthLabel(month).split(" ")[0];
  const cols = "minmax(0,1.5fr) 140px 120px 80px 110px";

  const dashAccounts = [
    ...state.accounts.filter((a) => a.type === "Asset" && !a.seeded && !a.commodity),
    ...state.accounts.filter((a) => a.type === "Liability"),
  ];

  return (
    <AppShell>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <AStat label="Total balance" value={bankTotal} sub={`${banks.length} accounts · USD`} />
        <AStat label={`Income · ${monthShort}`} value={income} sub={`${deposits} deposit${deposits === 1 ? "" : "s"}`} tone="pos" />
        <AStat label={`Spent · ${monthShort}`} value={-spent} sub={totalBudget ? `of ${money(totalBudget, { cents: false })} budgeted` : "no budgets yet"} />
        <AStat label="Net flow" value={net} sub={net >= 0 && income > 0 ? `${keptPct}% of income kept` : "spending exceeds income"} tone={net > 0 ? "pos" : undefined} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, height: 258, flex: "none" }}>
        <PanelA
          title="Cashflow · weekly"
          right={
            <span style={{ display: "inline-flex", gap: 14 }}>
              <span className="w-legend"><i style={{ background: "var(--positive)" }} />In</span>
              <span className="w-legend"><i style={{ background: "var(--negative)" }} />Out</span>
            </span>
          }
          bodyStyle={{ padding: "8px 14px 12px" }}
        >
          <WBars weeks={weeks} w={716} h={188} barW={22} monthAbbr={monthShort.slice(0, 3)} />
        </PanelA>
        <PanelA
          title="Budgets"
          right={<Button variant="secondary" size="sm" onClick={() => setEditingBudgets((v) => !v)}>{editingBudgets ? "Done" : "Edit"}</Button>}
          bodyStyle={{ overflowY: "auto" }}
        >
          {budgets.map((b) => (
            <ABudgetRow
              key={b.categoryId}
              b={b}
              editing={editingBudgets}
              onLimit={(limit) => dispatch({ type: "SET_BUDGET", categoryId: b.categoryId, limit })}
            />
          ))}
          {prompt && (
            <button
              className="wa-ghostrow"
              style={{ borderBottom: "none", height: 44 }}
              onClick={() => {
                const limit = Math.ceil(prompt.spent / 50) * 50 + 50;
                dispatch({ type: "SET_BUDGET", categoryId: prompt.cat.id, limit });
                showToast(`Budget set · ${prompt.cat.label} ${money(limit, { cents: false })}`);
              }}
            >
              <I.plus size={13} />
              <span>{prompt.cat.label} · {money(prompt.spent, { cents: false })} so far — set a budget</span>
            </button>
          )}
        </PanelA>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <PanelA
          title="Recent activity"
          right={
            <Link to="/transactions" style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, color: "inherit" }}>
              View all <Keys k="G T" />
            </Link>
          }
        >
          <div className="wa-thead" style={{ gridTemplateColumns: cols }}>
            <span>Merchant</span><span>Category</span><span>From</span><span>Time</span><span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {txns.slice(0, 5).map((t) => (
            <div key={t.id} className="wa-tr" style={{ gridTemplateColumns: cols }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0, fontWeight: 600, fontSize: 13 }}>
                <CatChip cat={topCategory(state, t.categoryId)} size={24} icon={13} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</span>
              </span>
              <span style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.type === "transfer" ? "Transfer" : t.type === "debt" ? "Debt / loan" : categoryPath(state, t.categoryId)}
              </span>
              <span style={{ color: "var(--ink-2)" }}>{accountById(state, t.accountId)?.name}</span>
              <span className="w-amount" style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: 12 }}>{t.time}</span>
              <Amt v={t.amount} size={13} style={{ textAlign: "right" }} />
            </div>
          ))}
        </PanelA>
        <PanelA title="Accounts" right={<Link to="/accounts" style={{ fontSize: 12, fontWeight: 600, color: "inherit" }}>Manage</Link>}>
          {dashAccounts.map((a) => (
            <div key={a.id} className="wa-tr" style={{ gridTemplateColumns: "minmax(0,1fr) auto", height: 46 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 13 }}>{a.name}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                  {a.commodity ? `${a.qty} ${a.unit} · commodity` : a.sub ?? a.type}
                </span>
              </span>
              <Amt v={a.balance} sign={a.balance < 0} tone={a.balance < 0 ? "neg" : ""} size={13} />
            </div>
          ))}
        </PanelA>
      </div>
    </AppShell>
  );
}
