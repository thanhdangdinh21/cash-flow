# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────────────
# Stage 1 — builder: install deps, generate Prisma client, compile,
# and carve out a production-only bundle for the runtime.
# (This stage also has the Prisma CLI, so the `migrate` compose service
#  reuses it to run migrations.)
# ──────────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

# Prisma needs OpenSSL to select its engine; the slim image omits it.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

# Manifests first so this (slow) install layer stays cached until deps change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/i18n/package.json packages/i18n/
COPY packages/shared/package.json packages/shared/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

# Generate the typed Prisma client (needs the schema + config, no DB).
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm exec prisma generate

# Compile the API (NestJS → apps/api/dist).
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter api build

# Production-only bundle: just the API's runtime deps (no dev deps, no Prisma
# CLI, no web/mobile trees) hoisted into /prod/node_modules.
RUN pnpm --filter api deploy --prod /prod
# pnpm deploy honors .gitignore (so it skips dist/) and doesn't carry the
# generated Prisma client (it's generated, not a package) — add both explicitly.
RUN cp -R /app/apps/api/dist /prod/dist \
    && mkdir -p /prod/node_modules/.prisma \
    && cp -R /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client \
            /prod/node_modules/.prisma/client

# ──────────────────────────────────────────────────────────────────────
# Stage 2 — runtime: lean image, runs the compiled API only.
# Migrations run separately (see the `migrate` service in docker-compose.yml),
# so this image doesn't carry the Prisma CLI.
# ──────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /prod ./

USER node
EXPOSE 3001
CMD ["node", "dist/main"]
