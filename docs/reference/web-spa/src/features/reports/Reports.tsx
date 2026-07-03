import { AppShell, FootA, PanelA } from "../../shell/AppShell";
import { Amt, Keys } from "../../ui/bits";
import { Badge, Button } from "../../ui/primitives";
import { WBars, WDonut, WLine } from "../../ui/charts";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import {
  budgetRows, categoryMonthSpend, monthIncome, monthSpent, netWorthSeries,
  spendByCategory, weeklyCashflow,
} from "../../state/selectors";
import { TREND_DINING_HISTORY } from "../../data/seed";
import { money, monthLabel } from "../../data/format";

export function Reports() {
  const { state, dispatch } = useStore();
  const { month, showToast } = useUi();

  const spend = spendByCategory(state, month);
  const total = spend.reduce((s, x) => s + x.amount, 0);
  const slices = spend.map((s) => ({ v: s.amount, color: s.cat.tint }));
  const series = netWorthSeries(state);
  const growth = series[series.length - 1].v - series[0].v;
  const income = monthIncome(state, month);
  const spent = monthSpent(state, month);
  const weeks = weeklyCashflow(state, month);
  const monthShort = monthLabel(month).split(" ")[0].slice(0, 3);

  // The "one thing to fix": worst over-budget category, with the roomiest under-budget donor.
  const budgets = budgetRows(state, month);
  const worst = budgets.filter((b) => b.over).sort((a, b) => (b.spent - b.limit) - (a.spent - a.limit))[0];
  const donor = budgets.filter((b) => !b.over).sort((a, b) => (b.limit - b.spent) - (a.limit - a.spent))[0];
  const overBy = worst ? Math.ceil(worst.spent - worst.limit) : 0;
  const trendCat = worst ? state.categories.find((c) => c.id === worst.categoryId) : state.categories.find((c) => c.id === "dining");
  const trendData = [
    ...(trendCat?.id === "dining" ? TREND_DINING_HISTORY : []),
    { m: monthShort, v: trendCat ? categoryMonthSpend(state, trendCat.id, month) : 0 },
  ];

  return (
    <AppShell
      footer={<FootA left={`${monthLabel(month)} · all accounts`} right={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Keys k="← →" /> change month</span>} />}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <PanelA
          title="Net worth · 6 months"
          right={<Amt v={series[series.length - 1].v} sign={false} cents={false} size={15} />}
          bodyStyle={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column" }}
        >
          <div style={{ fontSize: 11.5, color: growth >= 0 ? "var(--positive)" : "var(--negative)", fontWeight: 600, marginBottom: 4 }} className="w-amount">
            {money(growth, { sign: true, cents: false })} since {series[0].m === "Oct" ? "October" : series[0].m}
          </div>
          <WLine data={series} w={500} h={210} />
        </PanelA>

        <PanelA
          title="Income vs spending"
          right={
            <span style={{ display: "inline-flex", gap: 14 }}>
              <span className="w-legend"><i style={{ background: "var(--positive)" }} />In {money(income, { cents: false })}</span>
              <span className="w-legend"><i style={{ background: "var(--negative)" }} />Out {money(spent, { cents: false })}</span>
            </span>
          }
          bodyStyle={{ padding: "10px 14px 10px" }}
        >
          <WBars weeks={weeks} w={500} h={230} barW={20} monthAbbr={monthShort} />
        </PanelA>

        <PanelA
          title="Spending by category"
          right={<Amt v={-total} cents={false} size={15} />}
          bodyStyle={{ padding: "6px 18px 12px", display: "flex", alignItems: "center", gap: 26 }}
        >
          {slices.length ? <WDonut slices={slices} size={170} thick={24} /> : (
            <div style={{ fontSize: 13, color: "var(--ink-4)", padding: 20 }}>Nothing to chart yet.</div>
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
            {spend.map((s) => (
              <div key={s.cat.id} style={{ display: "flex", alignItems: "center", gap: 9, height: 30, fontSize: 12.5 }}>
                <i style={{ width: 8, height: 8, borderRadius: 3, background: s.cat.tint, flex: "none" }} />
                <span style={{ fontWeight: 550, color: "var(--ink-2)" }}>{s.cat.label}</span>
                <span style={{ flex: 1 }} />
                <span className="w-amount" style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{total ? Math.round((s.amount / total) * 100) : 0}%</span>
                <Amt v={s.amount} sign={false} cents={false} size={12.5} style={{ width: 64, textAlign: "right" }} />
              </div>
            ))}
          </div>
        </PanelA>

        <PanelA
          title={`Category trend · ${trendCat?.label ?? "—"}`}
          right={worst ? <Badge tone="negative">Over by {money(overBy, { cents: false })}</Badge> : <Badge tone="positive">On track</Badge>}
          bodyStyle={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column" }}
        >
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 4 }}>
            {worst
              ? `${worst.label} is ${money(overBy, { cents: false })} over. Move money?`
              : "Budgets are on track this month."}
          </div>
          <WLine data={trendData} w={500} h={190} stroke={worst ? "var(--negative)" : "var(--ink)"} />
          {worst && donor && (
            <div style={{ display: "flex", marginTop: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  dispatch({ type: "SET_BUDGET", categoryId: worst.categoryId, limit: worst.limit + overBy });
                  dispatch({ type: "SET_BUDGET", categoryId: donor.categoryId, limit: Math.max(0, donor.limit - overBy) });
                  showToast(`Moved ${money(overBy, { cents: false })} from ${donor.label} to ${worst.label}`);
                }}
              >
                Move {money(overBy, { cents: false })} from {donor.label}
              </Button>
            </div>
          )}
        </PanelA>
      </div>
    </AppShell>
  );
}
