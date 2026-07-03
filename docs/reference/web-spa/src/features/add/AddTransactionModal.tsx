import { useEffect, useMemo, useState } from "react";
import { Button, IconButton, Input, Select, Tag } from "../../ui/primitives";
import { Eyebrow } from "../../ui/bits";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import { lendingBalance } from "../../state/selectors";
import { DEMO_TODAY } from "../../data/seed";
import { money, nowTimeLabel } from "../../data/format";
import type { DebtDir, Transaction, TxnType } from "../../data/types";

const TYPE_TABS: { id: TxnType; label: string }[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfer" },
  { id: "debt", label: "Debt / loan" },
];

const DEBT_DIRS: { id: DebtDir; label: string; sub: string; in: boolean; newDebt: boolean; who: string }[] = [
  { id: "lent", label: "Lent", sub: "They owe you", in: false, newDebt: true, who: "Borrower" },
  { id: "borrowed", label: "Borrowed", sub: "You owe them", in: true, newDebt: true, who: "Lender" },
  { id: "collected", label: "Collected", sub: "They paid you back", in: true, newDebt: false, who: "Borrower" },
  { id: "repaid", label: "Repaid", sub: "You paid them back", in: false, newDebt: false, who: "Lender" },
];

export function AddTransactionModal() {
  const { state, dispatch } = useStore();
  const { addPrefill, editTxn, closeAdd, showToast } = useUi();

  const [type, setType] = useState<TxnType>(editTxn?.type ?? addPrefill?.type ?? "expense");
  const [amountText, setAmountText] = useState(
    editTxn ? Math.abs(editTxn.amount).toFixed(2) : addPrefill?.amountText ?? "",
  );
  const [merchant, setMerchant] = useState(editTxn?.merchant ?? addPrefill?.merchant ?? "");
  const [categoryId, setCategoryId] = useState(editTxn?.categoryId ?? addPrefill?.categoryId ?? "");
  const [accountId, setAccountId] = useState(editTxn?.accountId ?? addPrefill?.accountId ?? "checking");
  const [toAccountId, setToAccountId] = useState(editTxn?.toAccountId ?? "travel");
  const [debtDir, setDebtDir] = useState<DebtDir>(editTxn?.debtDir ?? "lent");
  const [contactName, setContactName] = useState(editTxn?.contactName ?? state.contacts[0]?.name ?? "");
  const [interest, setInterest] = useState(editTxn?.interest && editTxn.interest !== "None" ? editTxn.interest : "");
  const [date, setDate] = useState(editTxn?.date ?? addPrefill?.date ?? DEMO_TODAY);
  const [note, setNote] = useState(editTxn?.note ?? addPrefill?.note ?? "");
  const [attached, setAttached] = useState(!!editTxn?.attach);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeAdd(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAdd]);

  const dir = DEBT_DIRS.find((d) => d.id === debtDir)!;
  const spendable = state.accounts.filter((a) => a.type === "Asset" || a.type === "Liability");
  const assets = state.accounts.filter((a) => a.type === "Asset");
  const cats = state.categories.filter((c) => c.type === (type === "income" ? "Income" : "Expense"));
  const catOptions = useMemo(() => {
    const tops = cats.filter((c) => !c.parentId);
    return tops.flatMap((top) => [
      { value: top.id, label: top.label },
      ...cats.filter((c) => c.parentId === top.id).map((c) => ({ value: c.id, label: `${top.label} — ${c.label}` })),
    ]);
  }, [cats]);

  const amount = parseFloat(amountText.replace(",", "."));
  const amountOk = !Number.isNaN(amount) && amount > 0;

  const settleBal = lendingBalance(state, contactName);
  const settleCaption =
    !dir.newDebt && contactName
      ? debtDir === "collected"
        ? `${contactName.split(" ")[0]} owes you ${money(Math.max(0, settleBal))} — ${money(Math.max(0, settleBal - (amountOk ? amount : 0)))} left after this.`
        : `You owe ${contactName.split(" ")[0]} ${money(Math.max(0, -settleBal))} — ${money(Math.max(0, -settleBal - (amountOk ? amount : 0)))} left after this.`
      : null;

  const canSave =
    amountOk &&
    (type === "transfer"
      ? accountId !== toAccountId
      : type === "debt"
        ? contactName.trim().length > 0
        : merchant.trim().length > 0);

  const saveLabel = editTxn
    ? "Save changes"
    : type === "expense" ? "Add expense"
    : type === "income" ? "Add income"
    : type === "transfer" ? "Move money"
    : dir.newDebt ? "Record debt" : debtDir === "collected" ? "Record collection" : "Record repayment";

  function save() {
    if (!canSave) return;
    const signed =
      type === "expense" ? -amount
      : type === "income" ? amount
      : type === "transfer" ? -amount
      : dir.in ? amount : -amount;

    const base: Omit<Transaction, "id"> = {
      type,
      merchant:
        type === "transfer"
          ? merchant.trim() || `Transfer · ${state.accounts.find((a) => a.id === accountId)?.name} → ${state.accounts.find((a) => a.id === toAccountId)?.name}`
          : type === "debt"
            ? merchant.trim() || `${dir.label} ${dir.in && dir.newDebt ? "from" : "to"} ${contactName}`.replace("Collected to", "Collected from")
            : merchant.trim(),
      categoryId: type === "expense" || type === "income" ? categoryId || undefined : undefined,
      amount: signed,
      date,
      time: editTxn?.time ?? nowTimeLabel(),
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      contactName: type === "debt" ? contactName.trim() : undefined,
      debtDir: type === "debt" ? debtDir : undefined,
      interest: type === "debt" && dir.newDebt ? interest.trim() || "None" : undefined,
      note: note.trim() || undefined,
      attach: attached ? "receipt.jpg" : undefined,
      recurring: editTxn?.recurring,
    };

    if (editTxn) {
      dispatch({ type: "UPDATE_TXN", txn: { ...base, id: editTxn.id } });
      showToast("Transaction updated");
    } else {
      dispatch({ type: "ADD_TXN", txn: base });
      showToast(
        type === "expense" ? `Added expense · ${money(-amount, { sign: true })}`
        : type === "income" ? `Added income · ${money(amount, { sign: true })}`
        : type === "transfer" ? "Money moved"
        : "Debt recorded",
      );
    }
    closeAdd();
  }

  const accent = type === "income" || (type === "debt" && dir.in) ? "var(--positive)" : "var(--ink)";
  const sign = type === "expense" ? "−" : type === "income" ? "+" : type === "debt" ? (dir.in ? "+" : "−") : "";

  return (
    <div className="w-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) closeAdd(); }}>
      <div className="wb-modal" role="dialog" aria-label={editTxn ? "Edit transaction" : "Add transaction"}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 19, fontWeight: 650, letterSpacing: "-0.015em" }}>
            {editTxn ? "Edit transaction" : "Add transaction"}
          </span>
          <span style={{ flex: 1 }} />
          <IconButton label="Close" onClick={closeAdd}><I.x size={16} /></IconButton>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {TYPE_TABS.map((t) => (
            <Tag key={t.id} selected={type === t.id} onClick={() => setType(t.id)}>{t.label}</Tag>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, padding: "26px 0 22px", borderBottom: "1px solid var(--line)", marginBottom: 18 }}>
          {sign && <span style={{ fontSize: 26, fontWeight: 600, color: accent === "var(--positive)" ? accent : "var(--ink-3)" }}>{sign}</span>}
          <span style={{ fontSize: 26, fontWeight: 600, color: "var(--ink-3)" }}>$</span>
          <input
            autoFocus
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.,]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            placeholder="0.00"
            aria-label="Amount"
            className="w-amount"
            style={{
              fontSize: 52, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1, color: accent,
              border: 0, outline: 0, background: "none", fontFamily: "var(--font-sans)",
              width: `${Math.max(4, amountText.length + 1)}ch`, maxWidth: 320, textAlign: "left",
            }}
          />
        </div>

        {type === "transfer" && (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "-8px 0 14px", textAlign: "center" }}>
            Moves between your own accounts — not income or spending.
          </div>
        )}

        {type === "debt" && (
          <div style={{ marginBottom: 16 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Direction</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {DEBT_DIRS.map((d) => (
                <button key={d.id} type="button" className={"w-dirtile" + (d.id === debtDir ? " on" : "")} onClick={() => setDebtDir(d.id)}>
                  <div className="t">{d.label}</div>
                  <div className="s">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {(type === "expense" || type === "income") && (
            <>
              <span style={{ gridColumn: "1 / -1" }}>
                <Input label={type === "income" ? "Payer" : "Merchant"} placeholder={type === "income" ? "Acme Payroll" : "Blue Bottle Coffee"} value={merchant} onChange={(e) => setMerchant(e.target.value)} />
              </span>
              <Select label={type === "income" ? "To account" : "From account"} value={accountId} onChange={(e) => setAccountId(e.target.value)}
                options={spendable.map((a) => ({ value: a.id, label: a.sub ? `${a.name} ·· ${a.sub.slice(-4)}` : a.name }))} />
              <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                options={[{ value: "", label: "Global (no category)" }, ...catOptions]} />
            </>
          )}

          {type === "transfer" && (
            <>
              <Select label="From account" value={accountId} onChange={(e) => setAccountId(e.target.value)}
                options={assets.map((a) => ({ value: a.id, label: `${a.name} · ${money(a.balance)}` }))} />
              <Select label="To account" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
                options={assets.map((a) => ({ value: a.id, label: `${a.name} · ${money(a.balance)}` }))} />
            </>
          )}

          {type === "debt" && (
            <>
              <Select label={dir.in ? "To account" : "From account"} value={accountId} onChange={(e) => setAccountId(e.target.value)}
                options={assets.filter((a) => !a.commodity).map((a) => ({ value: a.id, label: a.name }))} />
              <span>
                <Input label={dir.who} placeholder="Daniel Chen" value={contactName} onChange={(e) => setContactName(e.target.value)} list="mfw-contacts" />
                <datalist id="mfw-contacts">
                  {state.contacts.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </span>
              {dir.newDebt && <Input label="Interest" placeholder="2% · yearly" value={interest} onChange={(e) => setInterest(e.target.value)} />}
            </>
          )}

          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Note" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {type === "debt" && settleCaption && (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12 }}>{settleCaption}</div>
        )}

        {type !== "debt" && (
          <button
            type="button"
            onClick={() => setAttached((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 9, marginTop: 16, padding: "12px 14px", width: "100%",
              border: attached ? "1px solid var(--line-2)" : "1px dashed var(--line-2)", borderRadius: 14,
              color: attached ? "var(--ink-2)" : "var(--ink-3)", fontSize: 13, background: attached ? "var(--paper-2)" : "none",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {attached ? <I.paperclip size={15} /> : <I.camera size={15} />}
            <span>{attached ? "receipt.jpg attached — click to remove" : "Attach a receipt"}</span>
          </button>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <Button onClick={closeAdd}>Cancel</Button>
          <span style={{ flex: 1 }} />
          <Button variant="primary" disabled={!canSave} onClick={save}>{saveLabel}</Button>
        </div>
      </div>
    </div>
  );
}
