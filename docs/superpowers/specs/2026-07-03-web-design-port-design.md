# Spec: Port the Money Flow web design into Next.js

**Date:** 2026-07-03
**Status:** Approved by user (pending spec review)

## Context

A Claude Design handoff (`Money Flow Web.html`) was previously implemented as a
standalone Vite + React SPA that was dropped inside the Next.js App Router
directory (`apps/web/app/`), while the original Next.js pages were deleted
(uncommitted). The result is broken: every route 404s and `pnpm check-types`
fails because the Next.js tsconfig sweeps up the Vite sources.

The SPA is a complete, demo-only implementation of the design (localStorage
seed data, no backend). The monorepo already has a NestJS API (`apps/api`)
with JWT auth, and the Next.js app has axios + react-query + i18next (EN/VI)
infrastructure in place.

This spec describes porting the SPA's screens into the Next.js app properly,
wired to the real API. The Vite SPA at `apps/web/app/{src,index.html,...}`
serves as the visual and behavioral reference during the port and is deleted
at the end.

## Decisions (made with user)

1. **API-backed only; hide gaps.** Features without API support are omitted,
   not faked with local data.
2. **Tailwind re-implementation.** Design tokens move into Tailwind 4
   `@theme`; no `mf-*` CSS system.
3. **i18n from the start.** Every UI string is a translation key with EN and
   VI values in `packages/i18n`.
4. **react-query per domain.** The SPA's reducer store, selectors, and seed
   data are not ported; the server owns data.
5. **Library-backed components everywhere.** UI primitives build on Radix
   (extending the existing shadcn-style `components/ui/`), the command bar
   uses `cmdk`, and charts use Recharts — no hand-rolled primitives or SVG
   charts.

## API surface (already exists; no API changes in scope)

- `POST /auth/register`, `POST /auth/login` → `{ access_token, user }`
- `GET/PATCH /users/me`
- `GET/POST /accounts`, `GET/PATCH/DELETE /accounts/:id`,
  `POST /accounts/:id/holdings`, `DELETE /accounts/:id/holdings/:holdingId`
- `GET /transactions` (filters: accountId, categoryId, from, to, limit,
  cursor), `GET /transactions/:id`, `POST /transactions`,
  `DELETE /transactions/:id` — **no PATCH (no edit)**
- `POST /transactions` accepts all four types (EXPENSE, INCOME, TRANSFER,
  LOAN) incl. loan direction, contactId/contactName, interest, holdings
- `GET/POST /categories`, `PATCH/DELETE /categories/:id`,
  `POST /categories/:id/sub-categories`,
  `DELETE /categories/:id/sub-categories/:subId`
- `GET /contacts`, `POST /contacts`, `GET /contacts/:id/loans`
- `GET /reports/home` → `{ totalAssets, monthIncome, monthSpent, net,
  weeks[], wallets[], recent[] }`
- `GET /reports/net-worth?period=month|year`
- `GET /reports/spending-by-category?from&to&direction`
- `GET /reports/category-trend/:categoryId?months`

## Routes & screens

App Router route groups (restoring the structure the SPA replaced):

| Route | Content | Omitted (API gap) |
|---|---|---|
| `(auth)/login` | Design's Editorial login; `POST /auth/login`, token via existing `authStore` (cookie + localStorage, consumed by `proxy.ts`) | — |
| `(auth)/register` | Same layout adapted for register; `POST /auth/register` | — |
| `(app)/layout` | Workbench shell: sidebar, topbar, footer, settings popover (theme, density, keyboard hints, existing language switcher), global shortcuts (`G`+`D/T/A/C/R/M` jumps, `N`/`T`/`A`), ⌘K command bar | — |
| `(app)/dashboard` | KPI stats, weekly cashflow bars, accounts summary, recent activity — all from `GET /reports/home` | Budgets widget |
| `(app)/transactions` | Day-grouped table, type filter + text search, month pager, keyboard row nav (`↑↓⏎⌫`), checkbox multi-select with bulk delete, right-hand inspector | Edit (`E` key, edit form) — inspector offers delete only |
| `(app)/accounts` | Type-grouped table with subtotals + net worth, create-account modal (Cash & bank / Credit card / Commodity), inspector with commodity holdings add/remove or credit terms | — |
| `(app)/categories` | Collapsible tree with type filter, category editor (name/icon/color/parent), subcategory add/rename/delete | Delete-to-Global reassignment — the API soft-deletes the category (cascading to its subcategories), so the UI does a plain delete with a confirm dialog |
| `(app)/reports` | Net-worth line, income vs spending, category donut, category trend — from the four report endpoints | Over-budget trend, "Move $ from…" budget rebalance |
| `(app)/contacts` | Replaces design's Members screen: contact list with lending balances from `GET /contacts` + `/contacts/:id/loans`, add contact | Roles, invites, member management |
| `/` | Redirect handled by existing `proxy.ts` (auth → dashboard, else login) | — |

**Add Transaction modal** (from shell, `N`, or ⌘K tab-through): all four
types on one page — Expense, Income, Transfer, Debt/loan with the four
directions (Lent / Borrowed / Collected / Repaid), counterparty
(contactId or free-text contactName), interest fields for new debts,
loan selection for settlements. Maps 1:1 to `CreateTransactionDto`.

**Keyboard focus rule:** global shell shortcuts (`G` jumps, `N`/`T`/`A`) are
suppressed while focus is in an input, dialog, or the command bar; the
transactions table's row-nav keys apply only while the table has focus.
Screen-level handlers win over global ones.

**⌘K command bar** (`cmdk`): ports the SPA's parser
(`merchant amount @category [#account]`, `+` prefix = income) as pure client
code; `⏎` creates via the transactions mutation, `⇥` opens the modal
prefilled; fuzzy navigation commands included.

## Data layer

- `lib/api/<domain>.ts` — typed request functions per domain (auth, users,
  accounts, transactions, categories, contacts, reports) over the existing
  axios instance (`lib/api.ts`). Response/request types in `lib/api/types.ts`
  mirroring the API DTOs.
- `hooks/use-<domain>.ts` — react-query hooks; mutations invalidate their
  domain plus `reports`.
- 401 handling: axios response interceptor clears `authStore` and redirects
  to `/login`. (New work — `lib/api.ts` currently has only the request
  interceptor that attaches the token.)
- UI-only state (theme light/dark, table density, keyboard-hint visibility)
  in a small React context persisted to localStorage; the language preference
  keeps its existing i18next mechanism.

## UI foundation

- Design tokens (colors incl. dark palette, typography, spacing, radii) from
  the SPA's `src/styles/*.css` translated to Tailwind 4 `@theme` variables in
  `app/globals.css`. Dark mode = `dark` class on `<html>`, toggled by the
  settings context.
- `components/ui/` keeps its shadcn-style pattern (Radix + cva + tailwind-
  merge) and gains the additional primitives the screens need (expected:
  dropdown-menu, popover, tooltip, checkbox, table, command via `cmdk`,
  toast). Existing button/input/dialog/select/switch/badge/label are restyled
  to the design tokens.
- Charts: Recharts (bar = weekly cashflow, line = net worth / trend,
  donut = spending by category), styled with the design tokens.
- Icons: `lucide-react` (already a dependency) replaces the SPA's hand-drawn
  icon set.
- New dependencies: `recharts`, `cmdk` (+ any Radix packages for the new
  primitives).

## i18n

All strings in the ported screens use `react-i18next` keys defined in
`packages/i18n/src/locales/en.json` and `vi.json`. Existing behavior is
preserved: language switcher in settings, per-user preference applied on
login, `<html lang>` sync.

## Cleanup

- Delete the nested Vite app: `apps/web/app/src/`, `index.html`,
  `vite.config.ts`, `package.json`, `package-lock.json`, `tsconfig.json`,
  `README.md` (this also fixes `check-types`).
- Stage the already-deleted old Next.js pages as part of the same change.
- Remove now-unused web dependencies if any remain after the port.

## Error handling

- Query errors render an inline error state with retry on each screen.
- Mutation errors surface via toast; forms keep user input.
- 401 anywhere → token cleared, redirect to `/login`.

## Verification / definition of done

- `pnpm check-types` and `pnpm lint` pass in `apps/web`.
- Manual browser verification against the running API (docker-compose):
  register + login, create all four transaction types (incl. a loan and its
  settlement), account CRUD + a commodity holding, category + subcategory
  CRUD, all report charts render with real data, contacts lending balances,
  dark mode, density toggle, keyboard shortcuts, ⌘K quick add, EN/VI switch.

## Deferred backlog (requires API work first — out of scope)

- Budgets (dashboard widget, over-budget report, rebalance action)
- Transaction edit (needs `PATCH /transactions/:id`)
- Members: roles, invites, management
