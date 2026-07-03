import { useEffect, useMemo, useState } from "react";
import { AppShell, FootA } from "../../shell/AppShell";
import { Amt, CatChip, CatLabel, Eyebrow, Kbd, Keys } from "../../ui/bits";
import { Badge, Button, IconButton, Tag } from "../../ui/primitives";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import {
  accountById, accountLabel, categoryById, categoryPath, dayGroups, monthTxns, topCategory,
} from "../../state/selectors";
import { dayLabel, money, monthLabel, shortDate } from "../../data/format";
import type { Transaction } from "../../data/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expenses" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfers" },
  { id: "debt", label: "Debt" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const COLS = "26px 70px minmax(0,1.4fr) 170px 140px 22px 110px";

const DEBT_LABEL: Record<string, string> = {
  lent: "Lent · they owe you",
  borrowed: "Borrowed · you owe them",
  collected: "Collected · paid back",
  repaid: "Repaid · settled up",
};

function Check({ on }: { on: boolean }) {
  return (
    <span className="w-chip" style={{ width: 15, height: 15, borderRadius: 4, border: on ? "none" : "1.5px solid var(--line-strong)", background: on ? "var(--ink)" : "var(--surface)", color: "var(--paper)" }}>
      {on && <I.check size={10} stroke={3} />}
    </span>
  );
}

function typeLine(state: ReturnType<typeof useStore>["state"], t: Transaction): string {
  if (t.type === "transfer") return `Transfer → ${accountById(state, t.toAccountId)?.name ?? "—"}`;
  if (t.type === "debt") return DEBT_LABEL[t.debtDir ?? "lent"];
  return categoryPath(state, t.categoryId);
}

function Inspector({ txn, onDelete }: { txn: Transaction; onDelete: () => void }) {
  const { state } = useStore();
  const { openEdit } = useUi();
  const cat = categoryById(state, txn.categoryId);
  const top = topCategory(state, txn.categoryId);
  return (
    <aside className="wa-insp">
      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
        {txn.type === "transfer" ? (
          <span className="w-chip" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--paper-2)", color: "var(--ink-2)" }}><I.swap size={18} /></span>
        ) : txn.type === "debt" ? (
          <span className="w-chip" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--info-soft)", color: "var(--info)" }}><I.handCoins size={18} /></span>
        ) : (
          <CatChip cat={top} size={38} icon={19} radius={11} />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.merchant}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{typeLine(state, txn)}</div>
        </div>
      </div>
      <div style={{ margin: "16px 0 6px" }}>
        <Amt v={txn.amount} size={28} weight={650} style={{ letterSpacing: "-0.02em" }} />
      </div>
      <div className="wa-field"><span>From</span><span style={{ fontWeight: 550 }}>{txn.type === "debt" && txn.debtDir && ["borrowed", "collected"].includes(txn.debtDir) ? txn.contactName : accountLabel(state, txn.accountId)}</span></div>
      <div className="wa-field"><span>To</span><span style={{ fontWeight: 550 }}>
        {txn.type === "transfer" ? accountLabel(state, txn.toAccountId)
          : txn.type === "debt" ? (["borrowed", "collected"].includes(txn.debtDir ?? "") ? accountLabel(state, txn.accountId) : txn.contactName)
          : txn.type === "income" ? accountLabel(state, txn.accountId)
          : cat ? categoryPath(state, txn.categoryId) : "Global"}
      </span></div>
      <div className="wa-field"><span>Date</span><span className="w-amount" style={{ fontWeight: 500 }}>{dayLabel(txn.date).replace(" ·", " ·")} · {txn.time}</span></div>
      {txn.type === "debt" && txn.interest && (
        <div className="wa-field"><span>Interest</span><span style={{ fontWeight: 550 }}>{txn.interest}</span></div>
      )}
      <div className="wa-field"><span>Note</span><span style={{ color: txn.note ? "var(--ink)" : "var(--ink-4)", fontWeight: txn.note ? 550 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.note ?? "Add a note"}</span></div>
      <div className="wa-field" style={{ borderBottom: "none" }}><span>Recurring</span><span style={{ fontWeight: 550 }}>{txn.recurring ? "Monthly" : "No"}</span></div>
      {txn.attach && (
        <>
          <Eyebrow style={{ marginTop: 14, marginBottom: 8 }}>Attachment</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 12, background: "var(--paper)" }}>
            <span className="w-chip" style={{ width: 36, height: 36, borderRadius: 9, background: "var(--paper-2)", color: "var(--ink-3)" }}><I.paperclip size={15} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 550 }}>{txn.attach}</span>
            <span style={{ flex: 1 }} />
            <I.eye size={14} style={{ color: "var(--ink-3)" }} />
          </div>
        </>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button variant="secondary" size="sm" onClick={() => openEdit(txn)}>Edit</Button>
        <Kbd>E</Kbd>
        <span style={{ flex: 1 }} />
        <IconButton label="Delete" size="sm" onClick={onDelete}><I.trash size={15} /></IconButton>
      </div>
    </aside>
  );
}

export function Transactions() {
  const { state, dispatch } = useStore();
  const { month, openCmd, openEdit, addOpen, cmdOpen, showToast } = useUi();
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const txns = useMemo(() => {
    let list = monthTxns(state, month);
    if (filter !== "all") list = list.filter((t) => t.type === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((t) => t.merchant.toLowerCase().includes(q) || (t.note ?? "").toLowerCase().includes(q));
    return list;
  }, [state, month, filter, query]);

  const groups = useMemo(() => dayGroups(txns), [txns]);
  const flatIds = useMemo(() => groups.flatMap((g) => g.txns.map((t) => t.id)), [groups]);
  const selected = txns.find((t) => t.id === selectedId) ?? txns[0] ?? null;
  const net = Math.round(txns.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const range = txns.length
    ? `${shortDate(txns[txns.length - 1].date)} – ${shortDate(txns[0].date).split(" ")[1]}`
    : monthLabel(month);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (addOpen || cmdOpen || (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"))) return;
      if (!selected) return;
      const idx = flatIds.indexOf(selected.id);
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedId(flatIds[Math.min(flatIds.length - 1, idx + 1)] ?? null); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedId(flatIds[Math.max(0, idx - 1)] ?? null); }
      else if (e.key.toLowerCase() === "e" || e.key === "Enter") { e.preventDefault(); openEdit(selected); }
      else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        dispatch({ type: "DELETE_TXN", id: selected.id });
        showToast("Transaction deleted");
      } else if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        setChecked((prev) => {
          const next = new Set(prev);
          next.has(selected.id) ? next.delete(selected.id) : next.add(selected.id);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, flatIds, addOpen, cmdOpen, dispatch, openEdit, showToast]);

  function toggleCheck(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <AppShell
      bodyStyle={{ padding: 0, gap: 0, overflow: "hidden" }}
      footer={
        <FootA
          left={
            checked.size
              ? `${checked.size} selected`
              : `${txns.length} transactions · ${range} · net ${money(net, { sign: true })}`
          }
          right={
            checked.size ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => {
                  checked.forEach((id) => dispatch({ type: "DELETE_TXN", id }));
                  setChecked(new Set());
                  showToast(`Deleted ${checked.size} transaction${checked.size === 1 ? "" : "s"}`);
                }}>Delete selected</Button>
                <Button variant="ghost" size="sm" onClick={() => setChecked(new Set())}>Clear</Button>
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Keys k="↑ ↓" /> select <Keys k="⏎" /> open <Keys k="E" /> edit
              </span>
            )
          }
        />
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 14px", borderBottom: "1px solid var(--line)", flex: "none" }}>
        {FILTERS.map((f) => (
          <Tag key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Tag>
        ))}
        <span style={{ width: 1, height: 18, background: "var(--line)", margin: "0 4px" }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--ink-4)", flex: 1, minWidth: 0 }}>
          <I.search size={13} />
          <input className="wa-filter-input" placeholder="Filter by merchant or note…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-2)" }}>
          <I.calendar size={13} /> {range}
        </span>
        <IconButton label="Columns" size="sm"><I.sliders size={15} /></IconButton>
        <IconButton label="Export" size="sm" onClick={() => showToast("Exported transactions.csv")}><I.fileText size={15} /></IconButton>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          <button className="wa-ghostrow" onClick={openCmd}>
            <I.plus size={13} />
            <span>New transaction — press <Kbd>N</Kbd>, or type &ldquo;blue bottle 6.75 @dining&rdquo;</span>
          </button>
          <div className="wa-thead" style={{ gridTemplateColumns: COLS }}>
            <span /><span>Time</span><span>Merchant</span><span>Category</span><span>From</span><span /><span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {groups.map((g) => (
            <div key={g.date}>
              <div className="wa-day">
                <span>{dayLabel(g.date)}</span>
                <span className="w-amount" style={{ marginLeft: "auto", letterSpacing: 0 }}>{money(g.total, { sign: true })}</span>
              </div>
              {g.txns.map((t) => {
                const isSel = selected?.id === t.id;
                return (
                  <div key={t.id} className={"wa-tr click" + (isSel ? " sel" : "")} style={{ gridTemplateColumns: COLS }} onClick={() => setSelectedId(t.id)}>
                    <span onClick={(e) => { e.stopPropagation(); toggleCheck(t.id); }} style={{ cursor: "pointer", display: "inline-flex" }}>
                      <Check on={checked.has(t.id)} />
                    </span>
                    <span className="w-amount" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{t.time}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0, fontWeight: 600 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</span>
                      {t.recurring && <I.repeat size={12} style={{ color: "var(--ink-3)", flex: "none" }} />}
                    </span>
                    {t.type === "expense" || t.type === "income" ? (
                      <CatLabel cat={topCategory(state, t.categoryId)} text={categoryById(state, t.categoryId)?.label ?? "Global"} size={22} icon={12} fontSize={12.5} />
                    ) : t.type === "transfer" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)" }}>
                        <span className="w-chip" style={{ width: 22, height: 22, borderRadius: 8, background: "var(--paper-2)", color: "var(--ink-2)" }}><I.swap size={12} /></span>
                        Transfer
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)", minWidth: 0 }}>
                        <span className="w-chip" style={{ width: 22, height: 22, borderRadius: 8, background: "var(--info-soft)", color: "var(--info)", flex: "none" }}><I.handCoins size={12} /></span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.debtDir![0].toUpperCase() + t.debtDir!.slice(1)}</span>
                      </span>
                    )}
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{accountById(state, t.accountId)?.name}</span>
                    <span style={{ color: "var(--ink-3)" }}>{t.attach ? <I.paperclip size={13} /> : null}</span>
                    <Amt v={t.amount} size={13} style={{ textAlign: "right" }} />
                  </div>
                );
              })}
            </div>
          ))}
          {!txns.length && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              No transactions match. <Badge>Try a different filter</Badge>
            </div>
          )}
        </div>

        {selected && (
          <Inspector
            txn={selected}
            onDelete={() => {
              dispatch({ type: "DELETE_TXN", id: selected.id });
              showToast("Transaction deleted");
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
