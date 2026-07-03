# Money Flow Web Design Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken hybrid state of `apps/web` with a working Next.js implementation of the Money Flow design, wired to the real NestJS API.

**Architecture:** App Router groups `(auth)` + `(app)`; typed API modules per domain over the existing axios client; react-query hooks with invalidation; Radix/shadcn-style primitives styled by the design tokens already in `apps/web/app/globals.css`; Recharts charts; cmdk ⌘K bar; every string through react-i18next (EN + VI).

**Tech Stack:** Next.js 16, React 19, Tailwind 4, @tanstack/react-query 5, axios, Radix UI, cmdk, Recharts, sonner, react-i18next, vitest (pure logic only).

**Spec (binding, esp. the routes table and its "omitted" column):** `docs/superpowers/specs/2026-07-03-web-design-port-design.md`

---

## Conventions (every task)

- **Reference implementation:** the Vite SPA, relocated in Task 1 to `docs/reference/web-spa/`. Replicate its layout and interactions, but translate: `mf-*` CSS → Tailwind token utilities (`bg-paper`, `text-ink-2`, `border-line`, `eyebrow`, `amount`, … — never hardcode hex); store/selectors → react-query hooks; hand-drawn icons → `lucide-react`; every string → `t("web.<screen>.<thing>")` with real EN **and** VI values in `packages/i18n/src/locales/` in the same commit.
- **Dark mode** flips via `data-theme="dark"` on `<html>`; components never branch on theme.
- **Verify per task:** `pnpm --filter web check-types && pnpm --filter web lint`, then browser-check against the real API (`docker compose up -d`, API at `localhost:3001/api`; register a `web-port@test.dev` user once and reuse it).
- **TDD** for pure logic only (Tasks 3, 13); screens are verified by typed compile + the listed browser checks — don't skip them.
- **Commit each task**, `feat(web):` / `chore(web):` style.

---

### Task 1: Clear the app dir, restore green baseline
- [ ] Recover old pages from git for reference: for each deleted `apps/web/app/(app|auth)/**.tsx` in HEAD, `git show HEAD:<path> > docs/reference/old-next-pages/<subpath>` (they hold the proven auth/i18n wiring).
- [ ] `mv` the Vite SPA files (`src`, `index.html`, `vite.config.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `README.md`) from `apps/web/app/` to `docs/reference/web-spa/`; `rm apps/web/app/page.module.css`.
- [ ] `git add -A apps/web/app` → `check-types` and `lint` now PASS (was ~30 errors).
- [ ] Commit (reference dirs are committed deliberately; deleted again in Task 19).

### Task 2: Dependencies
- [ ] `pnpm --filter web add recharts cmdk sonner @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-checkbox` and `-D vitest jsdom`.
- [ ] `check-types` PASS → commit.

### Task 3: Format utilities (TDD)
Files: `apps/web/lib/format.ts` + `format.test.ts` + `vitest.config.ts`; add `"test": "vitest run"`.
- [ ] Failing tests: `money(1234.5)`→`"$1,234.50"`; signed variants; `dayLabel` for today/yesterday (real today, not the SPA's `DEMO_TODAY`); `monthLabel("2026-07")`→`"July 2026"`; `addMonths("2026-01",-1)`→`"2025-12"`.
- [ ] Port `docs/reference/web-spa/src/data/format.ts` minus the demo-date anchor → tests PASS → commit.

### Task 4: UI settings context
Files: `apps/web/components/ui-settings.tsx`; wire into `components/providers.tsx` (+ sonner `<Toaster/>`), `app/layout.tsx`.
- [ ] Context `{ theme, density, showKeyHints }` persisted to `localStorage("mf-ui")`, applied as `data-theme`/`data-density` on `<html>`; tiny inline pre-paint script to avoid theme flash; `suppressHydrationWarning`.
- [ ] Verify toggle in browser → commit.

### Task 5: Typed API layer + 401 interceptor
Files: `apps/web/lib/api/{types,auth,users,accounts,transactions,categories,contacts,reports}.ts`; modify `lib/api.ts`.
- [ ] **Derive types from API source, don't guess:** read the DTOs, the use-case return shapes (esp. `query-transactions`, reports use-cases), and `prisma/schema.prisma` enums; mirror in `types.ts`.
- [ ] Thin typed functions per domain matching the spec's endpoint list.
- [ ] Response interceptor: on 401 outside `/login`, `authStore.clearToken()` + redirect to `/login`.
- [ ] `check-types` PASS; smoke-test one endpoint with curl + bearer token → commit.

### Task 6: React-query hooks
Files: `apps/web/hooks/{query-keys,use-auth,use-accounts,use-transactions,use-categories,use-contacts,use-reports}.ts`.
- [ ] Central `query-keys.ts`; query hooks wrap Task 5 modules; mutations invalidate their domain **plus all reports keys** and `toast.error` on failure.
- [ ] `useLogin`/`useRegister`: set token, apply the user's language preference exactly as `docs/reference/old-next-pages/(auth)/login/page.tsx` did, `router.replace("/dashboard")`.
- [ ] `check-types` PASS → commit.

### Task 7: UI primitives on Radix
- [ ] Restyle existing `components/ui/{button,input,dialog,select,switch,badge,label}.tsx` to the tokens (hairline `border-line-2`, 14px `rounded-md` controls, ink-on-paper primary, `ring-focus-ring` focus) — keep exported APIs.
- [ ] Add shadcn-style `{checkbox,tooltip,popover,dropdown-menu,table,command}.tsx` (command wraps cmdk). No styleguide page — screens verify visuals.
- [ ] Checks PASS → commit.

### Task 8: Auth screens
Files: `app/(auth)/{layout.tsx,login/page.tsx,register/page.tsx}`; locales `web.auth.*`.
- [ ] Editorial split layout from `docs/reference/web-spa/src/features/auth/Login.tsx`; real forms via `useLogin`/`useRegister`; drop demo affordances (login-with-anything, `D` key, sample data).
- [ ] Browser: bad password errors; fresh register lands authed; proxy bounces authed users off `/login` → commit.

### Task 9: Locale parity guard
- [ ] `apps/web/scripts/check-i18n-parity.mjs` — deep-compare en/vi key sets, exit 1 on drift; run in each later task's verify step → commit.

### Task 10: App shell
Files: `app/(app)/layout.tsx`, `components/shell/{sidebar,topbar,footer,settings-popover,command-bar placeholder}.tsx`, `hooks/use-global-shortcuts.ts`; restyle `components/layout/{nav-links,logo}.tsx`; locales `web.nav.*`, `web.settings.*`.
- [ ] Reference `web-spa/src/shell/AppShell.tsx`: sidebar (6 nav items, active from `usePathname`), topbar (title, ⌘K trigger, add button, settings), footer key hints (respect `showKeyHints`).
- [ ] Settings popover: theme, density, hints, existing `LanguageSwitcher`, sign out.
- [ ] Shortcuts: `G`+`D/T/A/C/R/M` navigate; `N`/`T`/`A` open modals. **Focus rule (spec):** inert while focus is in inputs/dialogs; screen handlers win via `stopPropagation`.
- [ ] Placeholder dashboard page so shell is navigable; browser-verify nav/theme/language/`G D` → commit.

### Task 11: Dashboard
Files: `app/(app)/dashboard/page.tsx`, `components/dashboard/*`; locales `web.dashboard.*`.
- [ ] From single `useHomeReport()`: KPI cards, weekly cashflow Recharts bars (positive/negative token colors), wallets summary, recent activity. **No budgets.**
- [ ] Extract shared `components/ui/query-state.tsx` (skeleton + inline error with retry) — reused by all screens.
- [ ] Browser: real numbers move after creating transactions; dark mode legible → commit.

### Task 12: Transactions screen
Files: `app/(app)/transactions/page.tsx`, `components/transactions/{transactions-table,inspector,filters-bar,month-pager}.tsx`; locales `web.transactions.*`. Reference `web-spa/src/features/transactions/Transactions.tsx`.
- [ ] Month pager → `from`/`to` params on `useTransactions`; client-side type filter + text search.
- [ ] Day-grouped table (`dayLabel`), density-aware rows, checkbox multi-select with bulk delete (confirm + toast).
- [ ] Inspector: details + delete only — **no edit (API gap)**.
- [ ] Keyboard: `↑/↓/⏎/⌫` active only while table focused.
- [ ] Browser: grouping/pager/filters/bulk delete/keys; empty state → commit.

### Task 13: Add Transaction modal
Files: `components/transactions/add-transaction-modal.tsx`, mounted in `(app)` layout behind a context (shell/⌘K/screens open it with presets); locales `web.addTransaction.*`.
- [ ] Tabs Expense · Income · Transfer · Debt/loan mapping 1:1 to `CreateTransactionDto`: shared amount/date/account/description; subcategory select for E/I; counter-account for transfer; debt directions Lent/Borrowed (contact combobox `contactId|contactName`, optional interest) and Collected/Repaid (open-loan select, remaining-balance caption).
- [ ] Submit via `useCreateTransaction`: success toast + reset; error keeps input.
- [ ] Browser: create all four types incl. loan + settlement; dashboard/list update → commit.

### Task 14: ⌘K command bar (parser TDD)
Files: `lib/quick-add-parser.ts` + test, `components/shell/command-bar.tsx`; locales `web.commandBar.*`.
- [ ] Failing tests first, parser takes injected `{categories, accounts}` (API types): `"blue bottle 6.75 @dining"` expense; `"acme payroll +2480 @salary"` income; `"lunch 14 #cash"` account match; no amount → null. Match categories **and subcategories** (API needs `subCategoryId`); default account = first ASSET.
- [ ] Implement → tests PASS.
- [ ] cmdk bar: ⌘K toggle, parsed preview, `⏎` creates, `⇥` opens modal prefilled, fuzzy nav commands.
- [ ] Browser quick-add round-trip → commit.

### Task 15: Accounts screen
Files: `app/(app)/accounts/page.tsx`, `components/accounts/{accounts-table,account-inspector,create-account-modal}.tsx`; delete orphaned `account-form-modal.tsx`; locales `web.accounts.*`.
- [ ] Type-grouped table + subtotals + net worth (verify LIABILITY sign convention in the API entity before summing); inspector with credit terms / commodity holdings (working add/remove), rename, delete.
- [ ] Create modal: Cash & bank / Credit card / Commodity — fields from the accounts DTOs.
- [ ] Browser: create each kind, add a lot, delete; net worth updates → commit.

### Task 16: Categories screen
Files: `app/(app)/categories/page.tsx`, `components/categories/{category-tree,category-editor}.tsx`; locales `web.categories.*`.
- [ ] Collapsible tree with type filter + editor pane; check `UpdateCategoryDto` for supported fields (icon/color/rename); subcategory add/delete; delete confirm notes soft-delete cascade. No delete-to-Global.
- [ ] Browser CRUD round-trip; deleted category gone from selects → commit.

### Task 17: Reports screen
Files: `app/(app)/reports/page.tsx`, `components/reports/*`; locales `web.reports.*`.
- [ ] Recharts: net-worth line (month/year toggle), income-vs-spending, spending-by-category donut (from/to + direction), slice click → category trend line. Token colors, `amount` tooltips, empty states. **No over-budget/rebalance.**
- [ ] Browser: all charts, light + dark → commit.

### Task 18: Contacts screen
Files: `app/(app)/contacts/page.tsx`, `components/contacts/*`; locales `web.contacts.*`. Reference Members.tsx, lending parts only.
- [ ] List with net lending balance; detail with loans (`useContactLoans`); "Record settlement" opens modal prefilled; add contact. No roles/invites.
- [ ] Browser: Task 13's loan shows correct outstanding → commit.

### Task 19: Cleanup + full walkthrough
- [ ] `git rm -r docs/reference` (grep first that nothing imports it); dependency audit, remove dead deps.
- [ ] All gates: `check-types`, `lint`, `test`, i18n parity, `pnpm --filter web build` → PASS.
- [ ] Full browser walkthrough per spec's definition of done: register→login, four txn types + settlement, account CRUD + holding, category CRUD, all charts, contacts, dark mode everywhere, density, key hints, `G` jumps + `N/T/A` + table keys, ⌘K, EN↔VI on every screen, logout bounce.
- [ ] Commit.

---

## Deferred backlog (do NOT implement)
Budgets, transaction edit (`PATCH /transactions/:id`), members/roles/invites, over-budget report — need API work first; see spec.
