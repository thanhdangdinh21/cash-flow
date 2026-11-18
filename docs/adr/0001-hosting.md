# ADR 0001: Hosting for staging (API, Postgres, web)

- **Status:** Proposed. Waiting on the owner's go-ahead before any account is created.
- **Date:** 2026-11-18
- **Issues:** #13 (deployment), #12 (CORS from env)

## Context

Money Flow has three parts to put online:

| Part | What it is | What it needs from a host |
|---|---|---|
| API | NestJS 12 on Node 24, already packaged by [`apps/api/Dockerfile`](../../apps/api/Dockerfile) | Runs one Docker container, has a health check, runs `prisma migrate deploy` before each release |
| Database | Postgres 16 via Prisma 7 | Managed (no server to patch), automatic backups |
| Web | Next.js 16 in `apps/web` | Builds from the monorepo; the browser calls the API directly at `NEXT_PUBLIC_API_URL` |

What matters for this project:

1. **Cheap.** It's a personal project. Single-digit or low-teens USD per month is fine; $50 is not.
2. **Simple for someone new to DevOps.** Click-through setup plus a config file in the repo. No servers, no Kubernetes, no CLI-only workflows.
3. **Close to Vietnam.** Singapore is the nearest region most hosts offer, about 30–50 ms from Hanoi and Ho Chi Minh City.
4. **Automatic Postgres backups**, with a restore you can do from a dashboard.
5. **Deploys from GitHub `main`**, ideally only after CI passes.

Prices below were checked on 2026-11-18 from each provider's own pricing pages and docs, in USD before tax.

## Options

### A. Render (API + Postgres) + Vercel Hobby (web) ⭐ recommended

| Piece | Plan | Price/month |
|---|---|---|
| Render workspace | Hobby | $0 |
| API | Web service `0.5c-512mb` (0.5 CPU, 512 MB), Singapore | $7 |
| Postgres 16 | `0.1c-256mb` (256 MB RAM), Singapore | $6 |
| Postgres storage | 5 GB at $0.30/GB | $1.50 |
| Web | Vercel Hobby (personal, non-commercial) | $0 |
| **Total** | | **≈ $14.50** |

- **Simplicity:** Render reads a [`render.yaml`](../../render.yaml) "Blueprint" from the repo and creates the API and the database together in one click. It builds the existing Dockerfile as-is. Vercel detects Next.js in a monorepo automatically.
- **Region:** Both Render services run in `singapore`. Vercel serves the web app from its global CDN, and the browser calls the API in Singapore directly.
- **Backups:** Paid Render Postgres has continuous backups with **point-in-time recovery (PITR)**. On the Hobby workspace you can restore to any moment in the **last 3 days**, from the dashboard. You can also create a logical export (kept 7 days) or run `pg_dump` yourself.
- **Migrations:** Render's `preDeployCommand` runs `prisma migrate deploy` in the new image before traffic switches over. If a migration fails, the new version never goes live and the old one keeps serving.
- **Deploys:** `autoDeployTrigger: checksPass` deploys each push to `main` only after GitHub CI is green. Vercel deploys `main` to production and builds a preview for every PR.
- **Catches:**
  - The free Render tiers don't fit this project. A free web service sleeps after 15 minutes idle and takes about a minute to wake up, and it can't run a pre-deploy command. A free database is **deleted after 30 days** and has no backups. So the paid tiers are the real minimum.
  - Vercel Hobby is for personal, non-commercial use only. If Money Flow ever charges money or shows ads, move the web app to Vercel Pro ($20/month) or to a Render web service ($7/month).
  - Hobby includes 5 GB/month of outbound bandwidth on Render, plenty for a JSON API with a handful of users.

### B. Railway (everything in one project)

- **Price:** The Hobby plan is $5/month, which includes $5 of usage, then you pay per second of CPU/RAM and per GB of storage. Realistically, an always-on API + Postgres + Next.js server lands around **$10–20/month**, and the bill changes month to month.
- **Simplicity:** Very easy. One dashboard holds all three services and deploys from GitHub. Singapore is available (`asia-southeast1`).
- **Backups:** Railway's Postgres is a container on a volume rather than a fully managed database service. Volume backups exist, but you schedule and restore them yourself, and backup storage is billed on top. Coverage is weaker than Render's built-in PITR.
- **Why not:** Usage-based billing is harder to predict, and the database is less managed.

### C. Fly.io (API) + Neon (Postgres) + Vercel (web)

- **Price:** A Fly `shared-cpu-1x` 256 MB machine in `sin` is about **$2–3/month**. Neon Free costs $0 (1 GB storage, 100 compute-hours/month). Vercel Hobby costs $0. **Total ≈ $3/month**, the cheapest of the three.
- **Simplicity:** The hardest of the three. Fly is driven by the `flyctl` CLI and `fly.toml`, the cheapest machine has only 256 MB of RAM (tight for NestJS), and new organisations no longer get a free allowance. That means three vendors and three dashboards.
- **Backups:** Neon Free only lets you restore to a point in the **last 6 hours**. Its database also suspends after 5 minutes idle, so the first request afterwards is slower.
- **Why not:** Saving about $11/month isn't worth the extra moving parts and the much weaker backups for a first deployment.

### Summary

| | A. Render + Vercel | B. Railway | C. Fly + Neon + Vercel |
|---|---|---|---|
| Monthly cost | **≈ $14.50, fixed** | ≈ $10–20, varies | ≈ $3 |
| Ease for a DevOps beginner | High | Highest | Low |
| Singapore | ✅ API + DB | ✅ | ✅ API (+ DB on Neon AWS Singapore) |
| Postgres backups | ✅ PITR, 3 days, dashboard restore | ⚠️ volume backups, self-managed | ⚠️ 6-hour restore window |
| Migrations before release | ✅ `preDeployCommand` | ✅ pre-deploy command | ✅ `release_command` |
| Config in repo | `render.yaml` | `railway.json` | `fly.toml` |
| Deploy only when CI is green | ✅ `checksPass` | ✅ "wait for CI" | Needs a GitHub Actions deploy job |

## Decision

**Option A: Render for the API and Postgres in Singapore, Vercel Hobby for the web app, ≈ $14.50/month.**

It has the best balance of cost, simplicity and safety for a first deployment. The infrastructure is described in `render.yaml` in the repo. The database is fully managed with dashboard restores. Migrations run before each release and block a bad deploy. Nothing deploys until CI passes. The price is fixed and known in advance.

## Consequences

- New files: [`render.yaml`](../../render.yaml) (API + database), plus [`docs/deploy.md`](../deploy.md) with deploy, rollback and backup/restore steps.
- The API image now includes the Prisma CLI in a separate `/app/migrate` folder, so Render's pre-deploy step can run `prisma migrate deploy`. The running app doesn't load it.
- The API reads allowed browser origins from `CORS_ORIGINS` (#12), which on staging is the Vercel production URL.
- `GET /api/health` returns 200 only when the database answers. Render uses it to decide whether a new version is healthy before switching traffic.
- Secrets live only in the Render and Vercel dashboards, never in the repo: `JWT_SECRET` (generated by you with `openssl rand -base64 48`), plus `DATABASE_URL` (Render fills it in automatically from the database).
- Vercel preview deployments (one per PR) get random URLs that aren't in `CORS_ORIGINS`, so they can load the site but can't call the staging API. That's intentional for now.
- Later: if this goes commercial, move the web app off Vercel Hobby. If Hobby's 3-day restore window is too short, the Render Pro workspace ($25/month) extends it to 7 days.

## Sources (checked 2026-11-18)

- Render pricing: <https://render.com/pricing>
- Render free-tier limits: <https://render.com/docs/free>
- Render Postgres backups and PITR: <https://render.com/docs/postgresql-backups>
- Render Blueprint spec: <https://render.com/docs/blueprint-spec>
- Railway regions: <https://docs.railway.com/reference/deployment-regions>
- Fly.io pricing: <https://fly.io/docs/about/pricing/>
- Neon plans: <https://neon.com/docs/introduction/plans>
- Vercel Hobby plan: <https://vercel.com/docs/plans/hobby>
