# Deploying Money Flow (production)

There are two environments: **local** and **production**. Why this setup, and what it trades away for $0/month: [ADR 0001](adr/0001-hosting.md).

```
 Browser ──► Vercel: money-flow-web        Next.js, global CDN        Hobby, $0
    │
    └──────► Render: money-flow-api         Docker, Singapore          free, $0
                  │  TLS over the internet
                  ▼
             Neon: money-flow               Postgres 16, Singapore     Free, $0

 GitHub Actions: nightly encrypted pg_dump (30 days) + daytime keep-alive ping
```

---

## 1. First-time setup (you do these steps)

Creating accounts, accepting terms and typing secrets are all yours to do. Do the steps in order; each takes a few minutes. Paste secrets only into the dashboards named here, never into chat, commits or issues.

### Step 0: merge the deployment PR

`render.yaml` and the scheduled workflows only run from `main`.

### Step 1: generate a JWT secret (on your Mac)

```bash
openssl rand -base64 48
```

Save it in your password manager. It signs everyone's login tokens.

### Step 2: Neon (database)

1. Go to <https://console.neon.tech/signup>, sign up (GitHub sign-in is fine) and accept the terms. The **Free** plan needs no card.
2. **Create project**:
   - **Project name:** `money-flow`
   - **Postgres version:** **16**. It must match local, CI, and the backup job's `pg_dump 16`.
   - **Cloud provider / Region:** **AWS · Asia Pacific (Singapore)** (`aws-ap-southeast-1`)
   - Click **Create project**.
3. On the project dashboard click **Connect**. You need **two** connection strings, so copy each one into your password manager:
   - **Connection pooling ON** → the **pooled** string. Its host contains `-pooler`. This becomes `DATABASE_URL`.
   - **Connection pooling OFF** → the **direct** string, with no `-pooler`. This becomes `DATABASE_URL_UNPOOLED` and `BACKUP_DATABASE_URL`.

   Both end in `?sslmode=require…`. Keep that part.

### Step 3: Render (API)

1. Go to <https://dashboard.render.com/register> → **Sign up with GitHub** → accept the terms. Keep the **Hobby** workspace. Free services need no card. Without one, Render pauses builds if the month's included build minutes run out.
2. Top right **+ New** → **Blueprint**.
3. **Connect GitHub**, giving access to **only** `thanhdangdinh21/cash-flow`, then pick it.
4. **Blueprint name:** `money-flow`. **Branch:** `main`. Render reads `render.yaml` and shows one service: `money-flow-api` (free, Singapore).
5. Fill in the four secret values:
   - `DATABASE_URL`: Neon **pooled** string (Step 2.3)
   - `DATABASE_URL_UNPOOLED`: Neon **direct** string (Step 2.3)
   - `JWT_SECRET`: from Step 1
   - `CORS_ORIGINS`: `http://localhost:3000` for now. You'll replace it in Step 5.
6. **Deploy Blueprint**. The first Docker build takes about 5–10 minutes on the free CPU. The log shows `All migrations have been successfully applied.` and then `Nest application successfully started`.
7. Copy the service URL from the top of the page, e.g. `https://money-flow-api.onrender.com`, then check it:

   ```bash
   curl https://money-flow-api.onrender.com/api/health
   # {"status":"ok","database":"up"}
   ```

### Step 4: Vercel (web)

1. Go to <https://vercel.com/signup> → **Hobby** → **Continue with GitHub** → accept the terms.
2. **Add New…** → **Project** → give access to **only** `thanhdangdinh21/cash-flow` → **Import**.
3. *Configure Project*:
   - **Project Name:** `money-flow-web`
   - **Root Directory:** **Edit** → `apps/web` → **Continue**
   - **Framework Preset:** Next.js (detected automatically). Leave the build and install commands on their defaults.
   - **Environment Variables:** `NEXT_PUBLIC_API_URL` = your Render URL **plus `/api`**, e.g. `https://money-flow-api.onrender.com/api`
4. **Deploy**, then copy the **production domain**, e.g. `https://money-flow-web.vercel.app`.
5. Go to **Settings → Build and Deployment → Node.js Version** → **24.x** → **Save**.

> `NEXT_PUBLIC_API_URL` is built into the web app at build time. If you change it, redeploy: **Deployments** → latest → **⋯** → **Redeploy**.

### Step 5: let the web app call the API (CORS)

Render → **money-flow-api** → **Environment** → set `CORS_ORIGINS` to the Vercel production domain, with **no trailing slash** (comma-separate several) → **Save and deploy**.

### Step 6: nightly encrypted backups

The repo is public, so backups are encrypted with [age](https://age-encryption.org) before they're uploaded. GitHub only ever sees the **public** key. The **private** key stays with you, and without it nobody (you included) can read the backups.

1. Install age and make a key pair on your Mac:

   ```bash
   brew install age
   ```

   ```bash
   age-keygen -o ~/money-flow-backup.key
   ```

   It prints `Public key: age1…`. That's the public half.
2. Store the **private key** safely: put the whole contents of `~/money-flow-backup.key` in your password manager, plus a second place you control (e.g. an encrypted USB drive). **Lose it and every backup is unreadable.** Never commit it or upload it to GitHub.
3. Add the public key as a repository **variable**. Paste the `age1…` value into the command:

   ```bash
   gh variable set BACKUP_AGE_RECIPIENT --repo thanhdangdinh21/cash-flow --body 'age1...'
   ```

   (Or in the browser: repo → **Settings → Secrets and variables → Actions → Variables → New repository variable**.)
4. Add the Neon **direct** string as a repository **secret**. The command prompts for it without echoing:

   ```bash
   gh secret set BACKUP_DATABASE_URL --repo thanhdangdinh21/cash-flow
   ```

5. Run it once now: repo → **Actions → Nightly database backup → Run workflow**. A green run ends with an artifact named `money_flow-<date>.dump.age`.
6. Rehearse a restore once (section 4) so you know it works before you need it.

From then on it runs every night at about **02:00 Vietnam time** and keeps each backup **30 days**.

### Step 7 (optional): keep the API awake during the day

```bash
gh variable set KEEPALIVE_URL --repo thanhdangdinh21/cash-flow --body 'https://money-flow-api.onrender.com/api/health/live'
```

This pings the API every 10 minutes from 07:00 to 23:00 Vietnam time, so daytime visits don't wait 30–60 s for it to wake. To pause it, delete the variable. To remove it entirely, delete `.github/workflows/keep-alive.yml`. To change the hours, edit its `cron` line (times are UTC, so Vietnam = UTC+7). GitHub runs scheduled jobs late when it's busy, so the API can still nap now and then.

### Step 8: check it end to end

1. Open the Vercel URL. If the API was asleep, the first load may take up to a minute.
2. **Register** → create a transaction → open **Reports**: the transaction shows up.

> **Scheduled workflows in public repos stop after 60 days without any commits.** GitHub emails you first. Re-enable them under **Actions**, or push any commit.

---

## 2. How deploys work from now on

| You do | What happens |
|---|---|
| Open a PR | CI runs. Vercel builds a **preview**. Its random URL isn't in `CORS_ORIGINS`, so it can't log in to the production API. That's expected. |
| Merge to `main` | **Vercel** deploys the web app. **Render** waits for every GitHub check to pass, builds the API image, and starts it with [`migrate-and-start.sh`](../apps/api/docker/migrate-and-start.sh): `prisma migrate deploy` over Neon's direct URL, then the server. Once `/api/health/live` answers, traffic switches to the new version. |
| A migration fails | The new container exits and never becomes healthy. Render keeps the previous version serving and marks the deploy failed. |

API-only paths trigger API builds (`buildFilter` in `render.yaml`); web or mobile-only changes don't rebuild it.

**Deploy by hand:** Render → **money-flow-api** → **Manual Deploy → Deploy latest commit**. On Vercel: **Deployments** → **⋯** → **Redeploy**.

**Never** point local tools at production. Don't put Neon URLs in your local `.env`, and never run `prisma migrate dev`, `migrate reset` or `db push` against Neon. Production only ever gets `migrate deploy`, from the start script.

---

## 3. Rolling back

### API (Render)

1. Render → **money-flow-api** → **Deploys** → pick the last good deploy → **Rollback** → **Rollback to this deploy**.
2. A dashboard rollback **turns auto-deploy off**, so a push can't bring the bug back. After the fix is merged, go to **Settings → Auto-Deploy → After CI Checks Pass** to turn it back on.

⚠️ **A rollback doesn't undo migrations.** The old code runs against the newer schema. Keep migrations backward-compatible (add first, remove in a later release). If a migration damaged data, restore the database (section 4).

### Web (Vercel)

**Deployments** → last good production deployment → **⋯** → **Instant Rollback**.

---

## 4. Backups and restore

You have two safety nets:

| | How far back | Where |
|---|---|---|
| Neon built-in restore | **Last 6 hours** (Free plan) | Neon console |
| Nightly encrypted dump | **Last 30 nights** | GitHub Actions artifacts |

### Mistake in the last 6 hours: Neon's restore

Neon console → **money-flow** → select the `main` (production) branch → **Postgres database → Backup & Restore → Restore from history** → pick a time just before the mistake → follow the prompts. It overwrites the whole branch. Neon automatically keeps a backup branch of the state it replaced, in case you pick the wrong time.

### Anything older: restore a nightly dump

1. **Download** the backup: repo → **Actions → Nightly database backup** → the run from the night you want → **Artifacts** → download. It arrives as a `.zip` holding `money_flow-<date>.dump.age`. Or from the terminal:

   ```bash
   gh run list --repo thanhdangdinh21/cash-flow --workflow db-backup.yml --limit 10
   ```

   ```bash
   gh run download <run-id> --repo thanhdangdinh21/cash-flow
   ```

2. **Decrypt** it with your private key:

   ```bash
   age --decrypt --identity ~/money-flow-backup.key money_flow-<date>.dump.age > money_flow.dump
   ```

3. **Make an empty target database.** Restore into a *new* database, never over the live one: Neon console → **money-flow** → **Databases** → **New database** → name it `money_flow_restore`. Then **Connect** → pick that database → copy its **direct** string.
4. **Restore** into it. Docker supplies the matching Postgres 16 tools:

   ```bash
   read -rs DB_URL   # paste the money_flow_restore direct string, press Enter (not echoed)
   ```

   ```bash
   docker run --rm -e DB_URL -v "$PWD":/backup postgres:16 \
     pg_restore --no-owner --no-acl --dbname "$DB_URL" /backup/money_flow.dump
   ```

5. **Check** it: Neon console → **SQL Editor** → database `money_flow_restore` → e.g. `select count(*) from transactions;`
6. **Switch the API over:** Render → **money-flow-api** → **Environment** → replace the database name at the end of both `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) with `money_flow_restore` → **Save and deploy**.
7. Afterwards, delete `money_flow.dump` from your Mac. It's your data in plain text.

**Practice run:** the same steps work against your local Docker Postgres. Run `docker compose up -d postgres`, create a database, and use `postgresql://postgres:postgres@host.docker.internal:5432/<db>` as `DB_URL`.

---

## 5. Settings reference

**Render → money-flow-api → Environment**

| Variable | Value | Set by |
|---|---|---|
| `NODE_ENV` | `production` | `render.yaml` |
| `API_DOCS` | `false` (`true` serves `/api/docs`) | `render.yaml` |
| `DATABASE_URL` | Neon **pooled** string (`-pooler` in host) | **you** (secret) |
| `DATABASE_URL_UNPOOLED` | Neon **direct** string, used by migrations only | **you** (secret) |
| `JWT_SECRET` | `openssl rand -base64 48` | **you** (secret) |
| `CORS_ORIGINS` | Vercel production domain, no trailing slash | **you** |
| `PORT` | set by Render | automatic, so don't set it |

**Vercel → money-flow-web → Settings → Environment Variables**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-render-api>.onrender.com/api` |

**GitHub → repo → Settings → Secrets and variables → Actions**

| Name | Kind | Value |
|---|---|---|
| `BACKUP_DATABASE_URL` | secret | Neon **direct** string |
| `BACKUP_AGE_RECIPIENT` | variable | age **public** key (`age1…`) |
| `KEEPALIVE_URL` | variable (optional) | `https://<your-render-api>.onrender.com/api/health/live` |

**Health endpoints**

- `GET /api/health/live`: `200 {"status":"ok"}`. Never touches the DB. Render's health check and the keep-alive use it, so Neon can scale to zero.
- `GET /api/health`: `200 {"status":"ok","database":"up"}` or `503`. Pings the DB. Use it for manual checks.

**Rotating secrets**

- `JWT_SECRET`: set a new value on Render → **Save and deploy**. Everyone is logged out and logs in again.
- Neon password: Neon → **Roles** → reset the password, then update `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (Render) and `BACKUP_DATABASE_URL` (GitHub).
- Backup key: make a new pair, update `BACKUP_AGE_RECIPIENT`, and **keep the old private key** until its backups expire (30 days).

---

## 6. Moving to paid later

No code changes needed (details and prices in the [ADR](adr/0001-hosting.md#moving-to-paid-later)):

- **No more cold starts:** Render → service **Settings → Instance Type → Starter `0.5c-512mb`** ($7/month), and set `plan: 0.5c-512mb` in `render.yaml`. Then delete `keep-alive.yml`. You can also move migrations to a `preDeployCommand` then.
- **Longer database restores:** Neon → **Billing → Launch** (pay as you go, no minimum; up to 7-day restore window).
- Keep the nightly encrypted backup either way.

---

## 7. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| First page load takes ~1 minute | The API was asleep (free plan) → normal. Set up Step 7, or upgrade. |
| Browser: *blocked by CORS policy* | `CORS_ORIGINS` ≠ the exact origin in the address bar → fix it in Render and redeploy |
| Web calls `localhost:3001` | `NEXT_PUBLIC_API_URL` missing on Vercel, or set after the build → add it and **Redeploy** |
| `/api/health` returns 503 | The API can't reach Neon → check the Neon project is active and the `DATABASE_URL` value |
| Deploy failed, log shows a Prisma error before "Nest application" | A migration failed → the old version is still serving. Fix the migration in a new PR. |
| Render never deploys after a merge | A GitHub check on that commit failed (`checksPass`) → fix CI, or **Manual Deploy** |
| Backup run fails at "Check configuration" | `BACKUP_DATABASE_URL` or `BACKUP_AGE_RECIPIENT` missing or wrong (Step 6) |
| Backup fails with `server version mismatch` | The Neon project isn't Postgres 16 → change `postgres:16` in `db-backup.yml` to match |
| Neon says compute hours are nearly used up | Something keeps the DB awake → make sure nothing polls `/api/health` (only `/api/health/live`) |
