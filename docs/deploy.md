# Deploying Money Flow (staging)

Why this setup: [ADR 0001](adr/0001-hosting.md).

```
 Browser ──► Vercel (web, Next.js)          global CDN, free Hobby plan
    │
    └──────► Render: money-flow-api          Singapore, Docker, $7/mo
                  │  private network
                  ▼
             Render: money-flow-db           Singapore, Postgres 16, $6/mo + $1.50 storage
```

The browser loads the web app from Vercel, then calls the API on Render directly. Only the API talks to the database.

---

## 1. First-time setup (you do these steps)

Creating accounts, adding a card, accepting terms and typing secrets are all yours to do. The steps below are in order, and each takes a few minutes.

### Step 0: merge the deployment PR

`render.yaml` deploys the `main` branch, so it has to be on `main` before Render can read it.

### Step 1: generate a JWT secret (on your Mac)

```bash
openssl rand -base64 48
```

Copy the output somewhere safe for a minute, such as your password manager. It signs everyone's login tokens. **Never commit it or paste it into chat.**

### Step 2: Render (API + database)

1. Go to <https://dashboard.render.com/register> and choose **Sign up with GitHub**. Accept the terms.
2. When asked for a workspace plan, keep **Hobby** ($0 per month; you only pay for the services below).
3. Add a card: avatar (top right) → **Billing** → **Add payment method**. Paid instances won't start without one.
4. Top right **+ New** → **Blueprint**.
5. Under **Connect a repository**, click **Configure GitHub** / **Connect GitHub**. Give Render access to **only** `thanhdangdinh21/cash-flow`, then pick it from the list.
6. **Blueprint name:** `money-flow-staging`. **Branch:** `main`. Render reads `render.yaml` and lists:
   - `money-flow-api` (web service, Singapore)
   - `money-flow-db` (Postgres, Singapore)
7. Render asks for the two values marked `sync: false`:
   - `JWT_SECRET`: paste the value from Step 1.
   - `CORS_ORIGINS`: type `http://localhost:3000` for now. You'll replace it with the Vercel URL in Step 4.
8. Check the cost summary (about $14.50/month: $7 + $6 + $1.50 storage), then click **Deploy Blueprint** / **Apply**.
9. Wait for the database to show **Available** and the API to show **Live**. The first Docker build takes about 5–10 minutes. The deploy log shows `All migrations have been successfully applied.` from the pre-deploy step.
10. Open **money-flow-api**. Its URL is at the top, something like `https://money-flow-api.onrender.com` (Render may add a suffix if the name is taken). Check it:

    ```bash
    curl https://money-flow-api.onrender.com/api/health
    # {"status":"ok","database":"up"}
    ```

### Step 3: Vercel (web app)

1. Go to <https://vercel.com/signup>, choose **Hobby** (personal, non-commercial), and **Continue with GitHub**. Accept the terms.
2. **Add New…** → **Project** → under *Import Git Repository*, click **Adjust GitHub App Permissions** if needed. Give Vercel access to **only** `thanhdangdinh21/cash-flow`, then click **Import** next to it.
3. On *Configure Project*:
   - **Project Name:** `money-flow-web`. This becomes the URL `https://money-flow-web.vercel.app`, or a suffixed one if the name is taken.
   - **Root Directory:** click **Edit** → choose `apps/web` → **Continue**.
   - **Framework Preset:** Next.js (detected automatically). Leave the build and install commands on their defaults.
   - **Environment Variables:** add
     `NEXT_PUBLIC_API_URL` = `https://money-flow-api.onrender.com/api` (your Render URL from Step 2.10, **plus `/api`**).
4. Click **Deploy**. When it finishes, copy the **production domain** shown on the project page.
5. Go to **Settings** → **Build and Deployment** → **Node.js Version** and pick **24.x**, then save.

> `NEXT_PUBLIC_API_URL` is built into the web app's JavaScript at build time. If you change it later, redeploy: **Deployments** → latest → **⋯** → **Redeploy**.

### Step 4: let the web app call the API (CORS)

1. Render → **money-flow-api** → **Environment**.
2. Edit `CORS_ORIGINS` to your Vercel production URL, with **no trailing slash**, e.g. `https://money-flow-web.vercel.app`. To allow several, separate them with commas.
3. **Save, rebuild, and deploy** (or **Save and deploy**). The API restarts with the new setting.

### Step 5: check it end to end

1. Open the Vercel URL → **Register** a new account.
2. Create a transaction, e.g. an expense from the default cash account.
3. Open **Reports**: the transaction shows up.

If the browser console says *blocked by CORS policy*, `CORS_ORIGINS` doesn't exactly match the URL in the address bar. Check `https`, the exact subdomain and the trailing slash.

---

## 2. How deploys work from now on

| You do | What happens |
|---|---|
| Open a PR | GitHub CI runs. Vercel builds a **preview** of the web app. The preview's random URL isn't in `CORS_ORIGINS`, so it can't log in to the staging API. That's expected. |
| Merge to `main` | **Vercel** deploys the web app to production. **Render** waits for every GitHub check on that commit to pass, then builds the API image, runs `prisma migrate deploy` (pre-deploy), starts the new version, waits for `GET /api/health` to return 200, and only then switches traffic. |
| A migration fails | The deploy stops. The old version keeps serving, and nothing is half-switched. Fix the migration in a new PR. |
| The new version fails its health check | Render keeps the old version live and marks the deploy failed. |

Only API-related changes (`apps/api`, `packages/shared`, `prisma`, lockfile, `render.yaml`) rebuild the API. Web-only or mobile-only changes skip it (`buildFilter` in `render.yaml`).

**Deploy by hand:** Render → **money-flow-api** → **Manual Deploy** → **Deploy latest commit**. On Vercel: **Deployments** → **⋯** → **Redeploy**.

**Never** run `prisma migrate dev` or `prisma migrate reset` against staging. They can drop data. Only `migrate deploy` runs there, automatically.

---

## 3. Rolling back

### API (Render)

1. Render → **money-flow-api** → **Deploys**.
2. Find the last good deploy → **Rollback** → **Rollback to this deploy**. This reuses the old image, so it takes about a minute.
3. A rollback from the dashboard **turns auto-deploy off**, so a new push can't bring the bug straight back. After the fix is merged, go to **Settings** → **Auto-Deploy** → **After CI Checks Pass** to turn it back on.

⚠️ **A rollback doesn't undo database migrations.** The old code runs against the newer schema. Keep migrations backward-compatible (add columns or tables first, remove them in a later release) so that's always safe. If a migration damaged data, restore the database (section 4).

### Web (Vercel)

1. Vercel → **money-flow-web** → **Deployments**.
2. Find the last good production deployment → **⋯** → **Instant Rollback** (or **Promote to Production**).

---

## 4. Backups and restore (Postgres)

### Automatic: point-in-time recovery (PITR)

The paid Render database is backed up continuously. On the Hobby workspace you can restore it to **any moment in the last 3 days** (7 days on the Pro workspace).

To restore after bad data or a bad migration:

1. Render → **money-flow-db** → **Recovery** → **Restore Database**.
2. Pick a time just before the problem (at least 10 minutes ago), name the new database e.g. `money-flow-db-restored`, and keep *copy settings*.
3. When it's **Available**, connect and check it: **Connect** → copy the PSQL command, then look at a few rows.
4. Point the API at it: **money-flow-api** → **Environment** → set `DATABASE_URL` to the restored database's **Internal Database URL** → **Save and deploy**.
5. Once you're happy, suspend or delete the old database. Note that `render.yaml` still names `money-flow-db`. For a permanent switch, rename the database in `render.yaml` to match, or keep the manual env var.

### On demand: a logical export

**money-flow-db** → **Recovery** → **Create export**, then download the `.dir.tar.gz` file. Render keeps it for 7 days.

### Your own copy: `pg_dump` (any time, kept as long as you like)

Get the **External Database URL** from **money-flow-db** → **Connect** → **External**. Treat it like a password. Docker supplies the matching Postgres 16 tools:

```bash
# Backup → money_flow-YYYY-MM-DD.dump in the current folder
read -rs DB_URL   # paste the External Database URL, press Enter (not echoed or saved in history)
docker run --rm -e DB_URL -v "$PWD":/backup postgres:16 \
  sh -c 'pg_dump --format=custom --no-owner --no-acl "$DB_URL" > /backup/money_flow-$(date +%F).dump'
```

```bash
# Restore INTO AN EMPTY database only (e.g. a fresh Render database or a local one)
read -rs DB_URL
docker run --rm -e DB_URL -v "$PWD":/backup postgres:16 \
  pg_restore --no-owner --no-acl --dbname "$DB_URL" /backup/money_flow-2026-11-18.dump
```

Rehearse the restore once against a local database (`docker compose up -d postgres`, then use `postgresql://postgres:postgres@host.docker.internal:5432/postgres` as `DB_URL`), so you know it works before you need it.

---

## 5. Settings reference

**Render: money-flow-api**

| Variable | Value on staging | Where it comes from |
|---|---|---|
| `NODE_ENV` | `production` | `render.yaml` |
| `API_DOCS` | `false` (set `true` to serve `/api/docs`) | `render.yaml` |
| `DATABASE_URL` | the database's internal URL | filled in by Render from `money-flow-db` |
| `JWT_SECRET` | output of `openssl rand -base64 48` | **you**, in the dashboard (secret) |
| `CORS_ORIGINS` | the Vercel production URL, no trailing slash | **you**, in the dashboard |
| `PORT` | set by Render | automatic, so don't set it |

**Vercel: money-flow-web**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-render-api>.onrender.com/api` |

**Rotating `JWT_SECRET`:** generate a new value, set it in Render → **Environment** → **Save and deploy**. Everyone is logged out, since old tokens stop verifying, and simply logs in again.

---

## 6. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| Browser: *blocked by CORS policy* | `CORS_ORIGINS` ≠ the exact origin in the address bar → fix it in Render and redeploy |
| Web calls `localhost:3001` | `NEXT_PUBLIC_API_URL` missing on Vercel, or set after the build → add it, then **Redeploy** |
| `/api/health` returns 503 | API is up but can't reach Postgres → check **money-flow-db** status and `DATABASE_URL` |
| Deploy failed at *pre-deploy* | A migration failed → read the deploy log. The old version is still serving. |
| Render never deploys after a merge | A GitHub check on that commit failed, or no checks ran (`checksPass` waits for green) → fix CI, or use **Manual Deploy** |
