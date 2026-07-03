import { useMemo, useState } from "react";
import { AppShell, FootA } from "../../shell/AppShell";
import { CatChip, Eyebrow, Kbd, Keys } from "../../ui/bits";
import { Badge, Button, IconButton, Input, Select, Tag } from "../../ui/primitives";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import { budgetRows } from "../../state/selectors";
import type { Category } from "../../data/types";

const ICON_CHOICES = ["cart", "coffee", "home2", "car", "film", "zap", "target", "wallet", "receipt", "gift", "repeat", "trendUp", "handCoins", "fileText"];
const TINT_CHOICES = ["#BE4A30", "#1A7A50", "#2C5E8A", "#B07A1E", "#7A4FB0", "#3A7A6E", "#8C897D"];
type TypeFilter = "All" | "Expense" | "Income";

export function Categories() {
  const { state, dispatch } = useStore();
  const { month, showToast } = useUi();
  const [filter, setFilter] = useState<TypeFilter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("dining");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newChild, setNewChild] = useState("");

  const cats = state.categories;
  const tops = useMemo(() => {
    let list = cats.filter((c) => !c.parentId);
    if (filter !== "All") list = list.filter((c) => c.type === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => c.label.toLowerCase().includes(q) || childrenOf(c.id).some((ch) => ch.label.toLowerCase().includes(q)));
    return [...list].sort((a, b) => a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats, filter, query]);

  function childrenOf(id: string): Category[] {
    return cats.filter((c) => c.parentId === id).sort((a, b) => a.label.localeCompare(b.label));
  }

  const selected = cats.find((c) => c.id === selectedId) ?? tops[0];
  const selectedTop = selected?.parentId ? cats.find((c) => c.id === selected.parentId) : selected;
  const over = selectedTop ? budgetRows(state, month).find((b) => b.categoryId === selectedTop.id && b.over) : undefined;
  const children = selected && !selected.parentId ? childrenOf(selected.id) : [];
  const parentOptions = selected
    ? cats.filter((c) => !c.parentId && c.type === selected.type && c.id !== selected.id)
    : [];

  function update(patch: Partial<Category>) {
    if (!selected) return;
    dispatch({ type: "UPDATE_CATEGORY", category: { ...selected, ...patch } });
  }

  function addCategory(parentId: string | null, label: string) {
    const base = parentId ? cats.find((c) => c.id === parentId) : undefined;
    const id = `cat-${Date.now()}`;
    dispatch({
      type: "ADD_CATEGORY",
      category: {
        id,
        label,
        icon: base?.icon ?? "flag",
        tint: base?.tint ?? "#8C897D",
        type: base?.type ?? (filter === "Income" ? "Income" : "Expense"),
        parentId,
        accountId: base?.accountId ?? (filter === "Income" ? "geninc" : "genexp"),
      },
    });
    return id;
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const listRow = (c: Category, depth: number) => {
    const kids = childrenOf(c.id);
    const isCollapsed = collapsed.has(c.id);
    return (
      <div key={c.id}>
        <div
          className={"wa-tr click" + (c.id === selected?.id ? " sel" : "")}
          style={{ gridTemplateColumns: depth ? "16px minmax(0,1fr) auto" : "minmax(0,1fr) auto auto", height: depth ? 40 : 46, paddingLeft: depth ? 28 : 14 }}
          onClick={() => setSelectedId(c.id)}
        >
          {depth > 0 && <span style={{ width: 16, borderLeft: "1px solid var(--line-2)", height: "100%", marginLeft: 4 }} />}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <CatChip cat={c} size={depth ? 22 : 26} icon={depth ? 12 : 14} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: 13 }}>{c.label}</span>
              {!depth && (
                <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)" }}>
                  {kids.length ? `${kids.length} subcategories` : "No subcategories"}
                </span>
              )}
            </span>
          </span>
          {!depth && <Badge tone={c.type === "Income" ? "positive" : "neutral"}>{c.type}</Badge>}
          {!depth ? (
            <span
              onClick={(e) => { e.stopPropagation(); toggleCollapse(c.id); }}
              style={{ display: "inline-flex", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}
              role="button"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {kids.length ? (isCollapsed ? <I.chevR size={14} /> : <I.chevD size={14} />) : <I.chevR size={14} style={{ opacity: 0.35 }} />}
            </span>
          ) : <span />}
        </div>
        {!isCollapsed && kids.map((k) => listRow(k, depth + 1))}
      </div>
    );
  };

  return (
    <AppShell
      actions={
        <>
          <Button variant="primary" size="sm" onClick={() => setSelectedId(addCategory(null, "New category"))}>New category</Button>
          <Kbd>C</Kbd>
        </>
      }
      bodyStyle={{ padding: 0, gap: 0, overflow: "hidden" }}
      footer={<FootA left={`${cats.filter((c) => !c.parentId).length} categories · A–Z`} right={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Keys k="↑ ↓" /> select <Keys k="⏎" /> edit</span>} />}
    >
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ width: 400, flex: "none", borderRight: "1px solid var(--line)", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 14px", borderBottom: "1px solid var(--line)", fontSize: 12.5 }}>
            {(["All", "Expense", "Income"] as TypeFilter[]).map((f) => (
              <Tag key={f} selected={filter === f} onClick={() => setFilter(f)}>{f}</Tag>
            ))}
            <span style={{ width: 1, height: 18, background: "var(--line)", margin: "0 2px" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-4)", flex: 1, minWidth: 0 }}>
              <I.search size={13} />
              <input className="wa-filter-input" placeholder="Filter categories…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </span>
          </div>
          {tops.map((c) => listRow(c, 0))}
        </div>

        {selected && (
          <div key={selected.id} style={{ flex: 1, minWidth: 0, padding: "22px 26px", display: "flex", flexDirection: "column", gap: 0, maxWidth: 560, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CatChip cat={selected} size={44} icon={21} radius={13} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-0.015em" }}>{selected.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {selected.parentId ? `Subcategory of ${cats.find((c) => c.id === selected.parentId)?.label}` : `${selected.type} category`}
                </div>
              </div>
              {over && <span style={{ marginLeft: "auto" }}><Badge tone="negative">Over budget</Badge></span>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
              <Input label="Name" value={selected.label} onChange={(e) => update({ label: e.target.value })} />
              <Select
                label="Account"
                value={selected.accountId}
                onChange={(e) => {
                  const accountId = e.target.value;
                  update({ accountId, type: accountId === "geninc" ? "Income" : "Expense" });
                }}
                options={state.accounts.filter((a) => a.type === "Income" || a.type === "Expense").map((a) => ({ value: a.id, label: a.name }))}
              />
              <span style={{ gridColumn: "1 / -1" }}>
                <Select
                  label="Parent category"
                  value={selected.parentId ?? ""}
                  onChange={(e) => update({ parentId: e.target.value || null })}
                  options={[{ value: "", label: "None — top level" }, ...parentOptions.map((c) => ({ value: c.id, label: c.label }))]}
                />
              </span>
            </div>

            <Eyebrow style={{ marginTop: 22, marginBottom: 8 }}>Icon & color</Eyebrow>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ICON_CHOICES.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => update({ icon: ic })}
                  style={{ border: selected.icon === ic ? "1.5px solid var(--ink)" : "1px solid var(--line)", background: "var(--surface)", borderRadius: 9, padding: 3, cursor: "pointer", display: "inline-flex" }}
                  aria-label={`Icon ${ic}`}
                >
                  <CatChip cat={{ icon: ic, tint: selected.tint }} size={26} icon={14} />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {TINT_CHOICES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ tint: t })}
                  style={{ width: 22, height: 22, borderRadius: 7, background: t, border: selected.tint === t ? "2px solid var(--ink)" : "2px solid transparent", cursor: "pointer" }}
                  aria-label={`Color ${t}`}
                />
              ))}
            </div>

            {!selected.parentId && (
              <>
                <Eyebrow style={{ marginTop: 26, marginBottom: 4 }}>Subcategories</Eyebrow>
                {children.map((s) => (
                  <div key={s.id} className="wa-field" style={{ minHeight: 42 }}>
                    <span style={{ color: "var(--ink)", fontWeight: 550 }}>{s.label}</span>
                    <span style={{ display: "inline-flex", gap: 2 }}>
                      <IconButton label="Rename" size="sm" onClick={() => setSelectedId(s.id)}><I.edit size={14} /></IconButton>
                      <IconButton label="Delete" size="sm" onClick={() => { dispatch({ type: "DELETE_CATEGORY", id: s.id }); showToast(`Deleted ${s.label}`); }}><I.trash size={14} /></IconButton>
                    </span>
                  </div>
                ))}
                {!children.length && <div style={{ fontSize: 12.5, color: "var(--ink-4)", padding: "10px 0" }}>No subcategories yet.</div>}
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      placeholder="Add a subcategory…"
                      value={newChild}
                      onChange={(e) => setNewChild(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newChild.trim()) { addCategory(selected.id, newChild.trim()); setNewChild(""); }
                      }}
                    />
                  </div>
                  <Button variant="secondary" size="sm" disabled={!newChild.trim()} onClick={() => { addCategory(selected.id, newChild.trim()); setNewChild(""); }}>Add</Button>
                </div>
              </>
            )}

            <div style={{ flex: 1, minHeight: 20 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Deleting a category keeps its transactions — they move to Global.</span>
              <span style={{ flex: 1 }} />
              <Button variant="secondary" size="sm" onClick={() => {
                const name = selected.label;
                dispatch({ type: "DELETE_CATEGORY", id: selected.id });
                setSelectedId(tops.find((t) => t.id !== selected.id)?.id ?? "");
                showToast(`Deleted ${name}`);
              }}>Delete category</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
