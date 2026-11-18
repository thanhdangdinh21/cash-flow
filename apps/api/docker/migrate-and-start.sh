#!/bin/sh
# Production start command (render.yaml `dockerCommand`).
#
# Render's free plan has no pre-deploy step, so migrations run here, before
# the server starts. If `prisma migrate deploy` fails, the container exits,
# the new deploy never becomes healthy, and Render keeps the old one serving.
#
# Neon's pooled URL (DATABASE_URL, host has `-pooler`) is for the app.
# Migrations need the direct URL, so DATABASE_URL_UNPOOLED is passed to the
# migrate command alone. prisma.config.ts deliberately reads only DATABASE_URL,
# so no local tool or test run can ever pick up a production
# DATABASE_URL_UNPOOLED by accident.
set -eu

DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" \
  /app/migrate/node_modules/.bin/prisma migrate deploy \
  --config /app/migrate/prisma.config.ts

exec node /app/dist/main
