# Money Flow — Roadmap

**Goal:** ship the mobile app to the App Store and Google Play, backed by a hosted API.
**Scope:** mobile + backend. The web client is paused; see [Later](#later).
**Last updated:** 2026-10-01

Sizes are rough effort: **S** ≈ a day or two, **M** ≈ up to a week, **L** ≈ more than a week.
Each phase should get its own design/plan in `docs/superpowers/` before work starts,
like the existing i18n and soft-delete plans.

---

## Where we are

| Phase | What | Status |
|---|---|---|
| 1 | Auth — register/login on API, web, mobile; schema v1 | ✅ Done (May 2026) |
| 2 | Accounts + currencies + holdings | ✅ Done (May 2026) |
| — | i18n (en, vi), user language preference | ✅ Done (May 2026) |
| — | Transactions (expense/income/transfer/loan), contacts, loans, reports | ✅ Done (Jun 2026) |
| — | Soft delete for transactions/journal entries/loans + integration test harness | ✅ Done (Jun 2026) |
| — | Docker Compose for API + Postgres | ✅ Done (Jun 2026) |

Budgets were built and then removed on 2026-06-22 (commit `bf6601e`). The removed
code — API module, mobile tab, `BudgetRow` component — is in git history at
`bf6601e^` and can be used as a reference.

**Known gaps today:** transactions can't be edited; accounts can't be edited from
mobile; contacts can't be edited or deleted; holdings can't be edited; there is no CI;
mobile has no lint or tests; there is no build or release setup.

---

## Phase 3 — Foundations (quality gates) · S–M

Make every later phase safer to build.

- [ ] GitHub Actions CI: API type-check, lint, unit, e2e, and integration tests (Postgres service container); mobile `tsc --noEmit`
- [ ] Mobile ESLint config + `lint` script; add to CI
- [ ] Mobile unit-test setup (Jest + `jest-expo` + React Native Testing Library) with a first test for `lib/format.ts` / `lib/txn.ts`
- [ ] Remove dead scaffold: `AppController`, `AppService`, and their spec in `apps/api/src`
- [ ] Clear the 15 API lint warnings (mostly `no-unsafe-argument` in integration specs; one unawaited `bootstrap()` in `main.ts`)
- [ ] Tick off or archive the completed plans in `docs/superpowers/plans/`

**Done when:** CI is required on PRs to `main` and is green.

## Phase 4 — Core completeness · M

Close the gaps in what the app already does before adding features.

- [ ] **Edit transactions** (API + mobile): implemented as reverse-old + apply-new inside one `$transaction()`, reusing the delete and create use-cases. Covers amount, date, accounts, category, note. Loan origin and settlement edits need explicit rules; block them at first if needed.
- [ ] **Edit accounts on mobile** (API `PATCH /accounts/:id` already exists)
- [ ] **Contacts:** API update + soft delete (block delete while active loans exist); mobile screens
- [ ] **Holdings:** API update (name/unit); mobile edit
- [ ] Integration tests for each new write path

**Done when:** every entity a user can create, they can also edit and delete from mobile.

## Phase 5 — Budgets (rebuild) · M

- [ ] Decide what went wrong last time (see [Open questions](#open-questions)) and write a short spec
- [ ] Schema: `Budget` with `deletedAt`, uniqueness enforced in the use-case layer (as the soft-delete plan intended)
- [ ] API: CRUD + "spent vs. limit" per category per month, excluding soft-deleted transactions
- [ ] Mobile: budgets screen, progress on the home screen and category detail
- [ ] Integration tests: back-dated and deleted transactions update the right month

## Phase 6 — Recurring transactions · M–L

- [ ] Schema: `RecurringRule` (template transaction + frequency + next run date + end condition)
- [ ] **Decide the execution model** (see [Open questions](#open-questions)): scheduled job on the server vs. generating due transactions when the user opens the app
- [ ] Idempotent generation: one rule × one due date → at most one transaction, even after retries
- [ ] Mobile: create from the add-transaction screen ("repeat"), list/pause/delete rules
- [ ] Editing a rule affects future occurrences only

## Phase 7 — Release readiness · L

Required before submitting to either store.

**Backend / infra**
- [ ] Host the API (HTTPS) + managed Postgres with automated backups; production env config and secrets
- [ ] Rate limiting on auth endpoints (`@nestjs/throttler`) and security headers
- [ ] Session handling: refresh tokens, or a deliberate longer-lived token with re-login UX (today: 7-day JWT, no refresh)
- [ ] Password reset via email (needs an email provider)
- [ ] **In-app account deletion** — required by Apple for apps that let users create accounts
- [ ] Structured logging + error tracking on the API

**Mobile**
- [ ] App identity: real name (currently `"mobile"`), bundle ID / package name, icon, splash, store screenshots
- [ ] EAS Build + EAS Submit (`eas.json`), separate dev/preview/production profiles and API URLs
- [ ] Crash reporting (e.g. Sentry) and OTA updates (`expo-updates`)
- [ ] Onboarding for first-time users (default accounts already exist; explain them)
- [ ] Decide on dark mode (`userInterfaceStyle` is currently fixed to `light`)
- [ ] Wire up or remove the existing `notificationsOn` toggle (push notifications are not implemented)

**Store and legal**
- [ ] Privacy policy URL; App Store privacy labels; Google Play Data safety form
- [ ] Beta: TestFlight + Play internal testing track
- [ ] Store listings in English and Vietnamese

**Done when:** v1.0 is approved on both stores.

## Phase 8 — Shared accounts · L (proposed for v1.1)

The schema already has `AccountUser` with `OWNER / ADMIN / EDITOR / VIEWER` roles, but
the API only ever creates `OWNER`. This touches every ownership check, so it is
scheduled **after** v1.0 to keep the first release small.

- [ ] Define what each role can do (view, add transactions, edit/delete others' transactions, manage members)
- [ ] Invite flow (by email or link), accept/decline, leave, remove member
- [ ] Replace owner-only checks with role checks across accounts, transactions, holdings, and reports
- [ ] Decide how shared accounts count toward each member's net worth
- [ ] Integration tests per role; audit who created or changed each transaction
- [ ] Mobile: members screen, role badges, invite UI

---

## Later

- **Report snapshots** — only once live reports get slow. The design is already in the README ("Reporting and snapshots"): synchronous on write, keyed by `txn.date`, with a `rebuildRange` oracle.
- **Weekly reports** (`SnapshotPeriod.WEEKLY` exists in the schema)
- **Import/export** (CSV import from bank statements; export for backup)
- **Web client** — catch up to mobile after v1.0
- **Push notifications** — budget alerts, recurring-transaction reminders (if not done in Phase 7)

## Open questions

1. **Why were budgets removed in June?** Was it a design problem (what should we do differently) or just deferral?
2. **Recurring execution model:** a server scheduler (needs a job runner on the host) or generating due transactions when the app opens (no infra, but only runs when the user is active)?
3. **Hosting:** where should the API and database run (e.g. Railway, Fly.io, Render, a VPS)? This affects cost and the job-runner choice.
4. **Shared accounts timing:** OK to ship v1.0 without them (Phase 8 as v1.1)?
5. **Multi-currency totals:** the home report's `totalAssets` sums `currentBalance` across accounts regardless of `currencyCode` (`home-report.use-case.ts`), so mixed-currency users see a meaningless total. For v1.0: add exchange rates, or show per-currency totals?
