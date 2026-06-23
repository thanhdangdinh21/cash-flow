# Money Flow

A full-stack personal finance app built on **double-entry accounting** — accounts, transactions, loans, commodity holdings, and net worth, shared across a backend, web client, and mobile client.

It's a **pnpm + Turborepo monorepo**: three apps (API, web, mobile) over a set of internal packages.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Monorepo | [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turborepo.dev) |
| API      | [NestJS 11](https://nestjs.com), JWT auth (`passport-jwt` + `bcrypt`) |
| Database | PostgreSQL via [Prisma 7](https://www.prisma.io) (`@prisma/adapter-pg` driver adapter) |
| Web      | [Next.js 16](https://nextjs.org) (App Router, React 19), Tailwind v4, Radix UI |
| Mobile   | [Expo 54](https://expo.dev) / React Native 0.81, `expo-router`, NativeWind (Tailwind v3) |
| Clients  | [TanStack Query](https://tanstack.com/query) + Axios; i18n via `i18next` (en, vi) |

## Repository Structure

```
money-flow/
├── apps/
│   ├── api/        NestJS backend (REST, port 3001, prefix /api)
│   ├── web/        Next.js web client (port 3000)
│   └── mobile/     Expo / React Native client (expo-router)
├── packages/
│   ├── shared/             @repo/shared — types & utils (currencies, i18n helpers)
│   ├── i18n/               @repo/i18n — translation catalogs (en, vi)
│   ├── ui/                 @repo/ui — shared React components
│   ├── eslint-config/      @repo/eslint-config
│   └── typescript-config/  @repo/typescript-config
├── prisma/
│   ├── schema.prisma       Data model (heavily commented — doubles as the spec)
│   ├── migrations/
│   └── seed.ts             Seeds the global default-category list
├── prisma.config.ts        Prisma 7 config (schema, datasource, seed)
└── .env                    DATABASE_URL, JWT_SECRET — git-ignored
```

Each API module (`auth · users · accounts · categories · contacts · transactions · reports`) is split into four layers: `domain/` (entities + repo interfaces), `application/` (use-cases + DTOs), `infrastructure/` (Prisma repos, guards, strategies), `presentation/` (controllers).

## How It Fits Together

```mermaid
flowchart LR
    web["Web (Next.js :3000)"] -- "Axios + JWT" --> api["NestJS API (:3001, /api)"]
    mobile["Mobile (Expo)"] -- "Axios + JWT" --> api
    api -- "Prisma 7 (pg adapter)" --> db[("PostgreSQL")]
```

Both clients call the same REST API with a `Bearer <JWT>` header (web stores it in `localStorage`, mobile in `expo-secure-store`). The API is the only thing that touches Postgres; all schema changes go through Prisma migrations.

## Prerequisites

- **Node ≥ 18** (developed on Node 22)
- **pnpm 9** — `corepack enable && corepack prepare pnpm@9.0.0 --activate`
- **PostgreSQL** reachable via a connection string
- Mobile: **Xcode** (iOS) and/or **Android Studio**

## Quick Start

```bash
pnpm install                       # 1. install all workspace deps

# 2. create root .env with DATABASE_URL and JWT_SECRET (see below)

pnpm exec prisma generate          # 3. set up the DB
pnpm exec prisma migrate dev
pnpm exec prisma db seed

# 4. start each app in its own terminal:
pnpm --filter api start:dev        # http://localhost:3001/api  (CORS allows :3000)
pnpm --filter web dev              # http://localhost:3000
cd apps/mobile && npx expo start --ios --localhost
```

Start the apps individually — root `pnpm dev` only covers `web` (the API uses `start:dev`, mobile uses `expo start`).

## Environment Variables

**Root `.env`** — loaded by the API (`ConfigModule`, `envFilePath: '../../.env'`) and Prisma (`dotenv/config`):

| Variable       | Purpose |
|----------------|---------|
| `DATABASE_URL` | Postgres connection string (e.g. `postgresql://user:pass@localhost:5432/money_flow`) |
| `JWT_SECRET`   | Signs/verifies auth tokens |
| `PORT`         | Optional — API port (default `3001`) |

**Client overrides** (optional; both default to `http://localhost:3001/api`): `NEXT_PUBLIC_API_URL` (web), `EXPO_PUBLIC_API_URL` (mobile).

## Database & Prisma

Schema: [`prisma/schema.prisma`](prisma/schema.prisma). Config: [`prisma.config.ts`](prisma.config.ts). Run from the repo root:

```bash
pnpm exec prisma generate        # after schema changes
pnpm exec prisma migrate dev     # create + apply a migration
pnpm exec prisma migrate reset   # drop, re-migrate, re-seed (destructive)
pnpm exec prisma db seed         # run prisma/seed.ts
pnpm exec prisma studio          # GUI
```

- `seed.ts` is **idempotent** and only populates the global `DefaultCategory` / `DefaultSubCategory` list. Per-user data (accounts, categories) is seeded **at signup** in the API's use-cases.
- Prisma 7 uses a driver adapter — see [`prisma.service.ts`](apps/api/src/prisma/prisma.service.ts).

## Running with Docker

The backend ships with a production [`Dockerfile`](apps/api/Dockerfile) and a [`docker-compose.yml`](docker-compose.yml) that runs the API **and** a Postgres database together — no local Postgres install needed.

```bash
docker compose up --build        # start API (:3001) + Postgres (:5432)
docker compose down              # stop (database data is kept)
docker compose down -v           # stop AND wipe the database volume
docker compose logs -f api       # follow the API logs
```

What happens on `up`: Postgres starts → a one-off **`migrate`** service applies Prisma migrations (`prisma migrate deploy`) and exits → the **`api`** starts on `http://localhost:3001/api`. The database lives in a named volume (`pgdata`), so your data survives restarts.

- **Config:** copy [`.env.example`](.env.example) to `.env` and set `JWT_SECRET`. Inside Compose the API reaches the DB at host `postgres` (the service name), not `localhost` — Compose sets that `DATABASE_URL` for you.
- **Fast inner loop:** you can still run the API natively (`pnpm --filter api start:dev`) against the Compose Postgres — point your local `.env` `DATABASE_URL` at `localhost:5432`.
- **Image layout:** a multi-stage build. The `api` runtime image is a lean **~545 MB** (production deps only, via `pnpm deploy`). The Prisma CLI and full toolchain live only in the `builder` stage, which the throwaway `migrate` service reuses — so they never bloat the deployable API image.

## Domain Model

A **real double-entry ledger**, not a list of transactions:

- **Every transaction = two `JournalEntry` rows** (one `DEBIT`, one `CREDIT`) between two accounts; `SUM(debits) = SUM(credits)` always holds.
- **Balances update incrementally** inside a `prisma.$transaction()` with the journal writes, so they never drift. Whether a debit raises or lowers a balance depends on the account type's normal side (see the reference at the bottom of `schema.prisma`).
- **Deletes are soft deletes — a deliberate UX choice.** The schema comments call journal entries immutable, but the app intentionally does the opposite: [`DeleteTransactionUseCase`](apps/api/src/transactions/application/use-cases/delete-transaction.use-case.ts) stamps `deletedAt` on the transaction + its journal entries (and, for a loan's origin, the loan itself) and atomically reverses every side effect (balances, holdings, contact/loan balances), so a deleted mistake vanishes from Activity while the row persists for recovery/audit. Every user-facing read and live aggregation filters `deletedAt: null` so soft-deleted rows stay hidden. (Editing isn't implemented yet; model it as reverse-old + apply-new.)
- **`transactionType`** (`EXPENSE` / `INCOME` / `TRANSFER` / `LOAN`) drives the debit/credit mapping and report routing.
- **System accounts** (`is_system`) are plumbing (General income/expense, loan Receivables/Payables) hidden from user lists and pickers.
- **Holdings** track multi-commodity positions (gold, BTC, shares) inside an `ASSET` account, each with its own quantity and cost basis.

Many rules live in the **use-case layer, not the DB** (same-currency transfers, ownership checks, unique active names) — read the use-case before assuming a DB constraint.

### Reporting and snapshots

Reports are computed **live** today from journal entries (e.g. the net-worth chart replays deltas backward from live balances). The `account_snapshots` / `net_worth_snapshots` / `category_snapshots` tables exist but **nothing writes to them yet** — live is cheap at current scale. When snapshots are added for scale, build them this way — **not a nightly cron**:

- **Synchronous on write**, inside the ledger's `$transaction()` (like `currentBalance`) → reports correct the instant a transaction is logged. No cron.
- **Keyed `MM/YYYY` on `txn.date`, never `createdAt`.** Users bulk-enter back-dated transactions, so one logged today but *dated* last month must update *last month's* row. (A "snapshot today's balance" job is fundamentally broken here.)
- **`category_snapshots` = per-month flow** ("money used/earned that month"): a transaction only touches its own month's row, even back-dated — spending doesn't carry forward, so the monthly reset is implicit in the key.
- **`account_snapshots` + `net_worth_snapshots` = cumulative** month-end balance: a current-month transaction touches only the latest row; a back-dated one touches its month **+ every later month** (one indexed `UPDATE ... WHERE period_date >= P0` — cheap at monthly grain). We store the **balance**, not a delta, so reads stay O(1); "balance now" comes from live `currentBalance`.
- **`rebuildRange(userId, fromDate)`** recomputes all three tables from journal entries — the oracle for backfill, repair, and tests. Build it first; add an optional periodic reconciliation as a drift safety net.
- **Coupling:** a delete (now a soft delete — set `deletedAt`) must reverse the affected snapshot rows in the same transaction (its month for flows; month + later months for cumulative), or past reports drift; `rebuildRange` must filter `deletedAt: null` on journal entries so soft-deleted rows don't re-enter the rebuild.

## API Surface

All routes are prefixed `/api`; most need a `Bearer` JWT from `/api/auth`.

`/api/auth` · `/api/users` · `/api/accounts` · `/api/categories` · `/api/contacts` · `/api/transactions` · `/api/reports`

## Common Scripts

Run from the repo root (`pnpm --filter <app>` to scope):

| Command | Does |
|---------|------|
| `pnpm build` / `pnpm lint` / `pnpm check-types` | `turbo run` across packages |
| `pnpm format` | Prettier on `**/*.{ts,tsx,md}` |
| `pnpm --filter api test` | API Jest suite |

## Onboarding Gotchas

Already worked out and baked into the repo — **don't "fix" them back**:

1. **Never add `@react-navigation/*` as a direct dep in `apps/mobile`.** `expo-router` pins a specific `@react-navigation/native`; adding `bottom-tabs` directly re-resolves it and crashes startup with `createScreenFactory is not a function`. A root `package.json` pnpm `override` pins `@react-navigation/bottom-tabs` to `7.16.1`. Need tab-bar prop types? Declare them locally — see [`TabBar.tsx`](apps/mobile/components/TabBar.tsx).
2. **Mobile is Tailwind v3, web is v4 — on purpose.** NativeWind 4 only supports v3, so keep `apps/mobile/global.css` on v3 directives (`@tailwind base;` …). The v4 `@import "tailwindcss"` syntax makes Metro hang silently.
3. **Start Expo with `--localhost`** on the iOS simulator (LAN IP times out).
4. **Don't strip `apps/mobile/metro.config.js`** — its `watchFolders` + `resolver.nodeModulesPaths` let Metro resolve pnpm's virtual store (`node_modules/.pnpm/`).
5. **Harmless:** `i18next::pluralResolver … not Intl API compatible` shows on the simulator only.
6. **Shared packages are live source** — editing `packages/shared` or `packages/i18n` affects both clients.
