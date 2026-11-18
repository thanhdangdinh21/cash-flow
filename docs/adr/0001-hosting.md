# ADR 0001: Hosting for production (API, Postgres, web)

- **Status:** Accepted, 2026-11-18. The owner chose the free setup.
- **Issues:** #13 (deployment), #12 (CORS from env)

## Context

There are two environments: **local** (docker-compose or native) and **production**. There is no staging; for a personal project, a separate environment would double the setup and cost without adding much.

Three parts go online:

| Part | What it is | What it needs from a host |
|---|---|---|
| API | NestJS 12 on Node 24, packaged by [`apps/api/Dockerfile`](../../apps/api/Dockerfile) | Runs one Docker container, has a health check, runs `prisma migrate deploy` before the server starts |
| Database | Postgres 16 via Prisma 7 (`@prisma/adapter-pg`) | Managed, with backups, because it holds **real personal financial data** |
| Web | Next.js 16 in `apps/web` | Builds from the monorepo; the browser calls the API directly at `NEXT_PUBLIC_API_URL` |

What we weighed: monthly cost, simplicity for someone new to DevOps, a region near Vietnam (Singapore), Postgres backups, and deploys from GitHub `main` after CI passes.

Prices were checked on 2026-11-18 from each provider's own pricing pages and docs, in USD before tax.

## Options

### A. Render paid (API + Postgres) + Vercel Hobby: ≈ $14.50/month

- API `0.5c-512mb` $7 + Render Postgres `0.1c-256mb` $6 + 5 GB storage $1.50. Both in Singapore.
- Always on, so no cold starts. Continuous backups with **3-day point-in-time restore** from the dashboard. Migrations run as a pre-deploy step.
- This was the original recommendation.

### B. Railway: ≈ $10–20/month, usage-based

- One dashboard for everything, Singapore available. But the bill varies month to month, and Postgres is a container on a volume with self-managed backups.

### C. Render free (API) + Neon free (Postgres) + Vercel Hobby: **$0/month** ⭐ chosen

| Piece | Plan | Price |
|---|---|---|
| API | Render **free** web service, Singapore | $0 |
| Postgres 16 | Neon **Free**, AWS Singapore (`aws-ap-southeast-1`) | $0 |
| Web | Vercel Hobby (personal, non-commercial) | $0 |
| Backups | Nightly encrypted `pg_dump` via GitHub Actions (public repo, so minutes are free) | $0 |
| **Total** | | **$0** |

### D. Fly.io + Neon + Vercel: ≈ $3/month

- Cheap, but driven by a command-line tool, with no free allowance for new orgs and only 256 MB of RAM. It costs more effort than C and gives nothing C doesn't.

### E. Self-hosting on the owner's Mac

- Free, but the API is down whenever the Mac sleeps or travels, you need a tunnel to reach it from outside, and home-network security becomes your job. Rejected.

## Decision

**Option C: Render free + Neon free + Vercel Hobby, $0/month.** The owner made this choice knowingly, over option A (paid, ≈ $14.50/month), which was recommended because the database holds real financial data.

## Trade-offs we're accepting, and how each is softened

| Trade-off | What it means day to day | Mitigation in this repo |
|---|---|---|
| **The API sleeps** after 15 idle minutes (Render free) | The first request after a quiet spell waits **~30–60 s** while the API wakes. Migrations on start add a few seconds. | [`keep-alive.yml`](../../.github/workflows/keep-alive.yml) pings `/api/health/live` every 10 min, **07:00–23:00 Vietnam time**. That's ≈ 500 of the 750 free instance-hours a month. GitHub's cron is approximate, so it can still nap occasionally. |
| **Short built-in restore window**: Neon Free restores only **6 hours** back | A mistake noticed the next morning can't be undone from Neon alone. | [`db-backup.yml`](../../.github/workflows/db-backup.yml): a nightly `pg_dump`, **encrypted with `age`** before upload (the repo is public), kept **30 days** as a workflow artifact. The owner holds the only private key. Restore steps are in [`deploy.md`](../deploy.md). Worst case, you lose up to a day of entries. |
| **The database scales to zero** after 5 idle minutes (Neon Free) | The first query after idling adds ~0.5–1 s. | The 100 CU-hours/month only last if the database can actually sleep, so: Render's health check uses the **DB-free** `/api/health/live`, the keep-alive hits that same route, and the `pg` pool closes idle connections after 10 s (`idleTimeoutMillis` in [`prisma.service.ts`](../../apps/api/src/prisma/prisma.service.ts)). |
| **No pre-deploy step** on Render free | Migrations can't run in a separate step before the new version takes traffic. | [`migrate-and-start.sh`](../../apps/api/docker/migrate-and-start.sh) runs `prisma migrate deploy` over Neon's **direct** connection, then starts the server. If a migration fails, the container exits, the deploy never turns healthy, and Render keeps the previous version serving. |
| **Limits**: Neon 1 GB storage and 100 CU-hours; Render 750 hours, 512 MB RAM, 0.1 CPU; Vercel Hobby non-commercial only | Fine for one person's finances. Builds and cold starts are slower on 0.1 CPU. | If any limit starts to pinch, see "Moving to paid later". |
| **Three vendors** (Render, Neon, Vercel) | Three accounts and dashboards. | Every setting is listed in [`deploy.md`](../deploy.md). The API config lives in [`render.yaml`](../../render.yaml). |

## Consequences

- [`render.yaml`](../../render.yaml) defines only the API (free plan, Singapore, `autoDeployTrigger: checksPass`, `dockerCommand: /app/migrate-and-start.sh`, `healthCheckPath: /api/health/live`).
- Two Neon connection strings, both secrets on Render:
  - `DATABASE_URL`, the **pooled** string (host contains `-pooler`), for the app.
  - `DATABASE_URL_UNPOOLED`, the **direct** string, for migrations only.

  The start script passes it to `prisma migrate deploy` alone. `prisma.config.ts` keeps reading only `DATABASE_URL`, so a local tool or test run can never pick up a production direct URL.
- `GET /api/health` (pings the DB) stays available for humans and manual checks. `GET /api/health/live` doesn't touch the DB.
- The API reads allowed browser origins from `CORS_ORIGINS` (#12); in production that's the Vercel URL.
- Secrets live only in the Render, Vercel and GitHub settings, never in the repo.

## Moving to paid later

Each piece upgrades independently, with no code changes:

| Pain | Upgrade | Cost |
|---|---|---|
| Cold starts | Render → service **Settings → Instance Type** → `0.5c-512mb` (Starter), and change `plan:` in `render.yaml` to match. Always on. Then delete `keep-alive.yml`. | $7/month |
| Want longer restores than 6 h, or more storage/compute | Neon → **Billing → Upgrade to Launch**: up to **7-day** restore window, scale-to-zero becomes optional. Pay as you go, no minimum: $0.106/CU-hour, $0.35/GB-month storage, $0.20/GB-month restore history. A small personal DB lands around a few dollars a month. | ~$1–5/month |
| Going commercial | Vercel Pro, or move the web app to a $7 Render web service | $20 or $7/month |

Keep the nightly encrypted backup even after upgrading: it's the only copy that lives outside the database provider.

## Sources (checked 2026-11-18)

- Render pricing: <https://render.com/pricing>
- Render free-tier limits: <https://render.com/docs/free>
- Render Blueprint spec (pre-deploy is paid-only): <https://render.com/docs/blueprint-spec>
- Render health checks: <https://render.com/docs/health-checks>
- Neon plans and pricing: <https://neon.com/docs/introduction/plans>, <https://neon.com/pricing>
- Neon regions: <https://neon.com/docs/introduction/regions>
- Neon + Prisma (pooled vs direct): <https://neon.com/docs/guides/prisma>
- Railway regions: <https://docs.railway.com/reference/deployment-regions>
- Fly.io pricing: <https://fly.io/docs/about/pricing/>
- Vercel Hobby plan: <https://vercel.com/docs/plans/hobby>
