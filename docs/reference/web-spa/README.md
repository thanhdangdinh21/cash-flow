# Money Flow — Web

Working implementation of the Claude Design handoff (`project/Money Flow Web.html`), built as a
Vite + React + TypeScript SPA. Direction **A · Workbench** for the app (dense, keyboard-first),
Direction **B · Editorial** for the login screen. No backend — demo data lives in
`localStorage` and is anchored to the design's date (March 24, 2026) so the screens match the mockups.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

Log in with anything, press `D`, or click "Explore with sample data".

## What's implemented

- **Dashboard** — KPI stats, weekly cashflow bars, budgets (inline-editable limits, "set a budget"
  ghost row), recent activity, accounts summary. All figures derive from transactions.
- **Transactions** — day-grouped table with type filters + text search, row selection with
  `↑ ↓` / `⏎` / `E` / `⌫` keys, checkbox multi-select with bulk delete, right-hand inspector
  (edit/delete, attachment), month pager.
- **Add transaction** — two paths:
  - **Modal** (primary): Expense · Income · Transfer · Debt/loan on one page. Debt has the four
    directions — Lent / Borrowed / Collected / Repaid — with counterparty, interest for new debts,
    and a remaining-balance caption for settlements.
  - **⌘K command bar**: real parser for `merchant amount @category [#account]`
    (e.g. `blue bottle 6.75 @dining`, `+` prefix = income). `⏎` adds instantly, `⇥` opens the
    modal prefilled; also fuzzy navigation commands.
- **Accounts** — type-grouped table with subtotals and net worth; inspector shows commodity
  lots (with working "Add lot") or credit terms. **Create account** offers the three kinds from
  the design chats: Cash & bank, Credit card (full credit terms), Commodity (unit + quantity).
- **Categories** — single-table `parentId` hierarchy: collapsible tree with type filter, editor
  for name / account / parent / icon / color, subcategory add/rename/delete, delete-to-Global.
- **Reports** — net-worth line, income vs spending, category donut, over-budget trend with a
  working "Move $ from …" budget-rebalance action.
- **Members** — role management, invites, and lending balances **derived from debt transactions**.
- **Global** — `G` then `D/T/A/C/R/M` jump keys, `N` new transaction, `T` transfer, `A` new
  account; settings popover with **light/dark theme**, table density, paper/ink sidebar, and
  keyboard-hint visibility (all persisted).

## Structure

```
src/
  styles/       design-system tokens (copied from the handoff bundle) + shell CSS
  data/         types, seed data, formatters
  state/        store (reducer + localStorage) and derived selectors
  ui/           icons, DS primitives (mf-*), charts, text bits
  shell/        app frame (sidebar/topbar/footer), UI context, shortcuts
  features/     one folder per screen + the add/create overlays
```
