# Money Flow API

NestJS 11 REST API on port `3001`, with every route under `/api`. Setup, env vars and Docker are covered in the [root README](../../README.md).

## Run

```bash
docker compose up -d postgres   # from the repo root, if you have no local Postgres
pnpm --filter api start:dev     # http://localhost:3001/api
```

## API docs

With the API running, open **<http://localhost:3001/api/docs>**. It's a [Scalar](https://scalar.com) reference generated from the code by [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction). The raw OpenAPI 3 spec is at `/api/docs-json`.

To try authenticated routes:

1. Call `POST /api/auth/login` with `{ "email": "...", "password": "..." }`, either from the docs or with curl. Use `POST /api/auth/register` first if you need an account.
2. Copy `accessToken` from the response.
3. Paste it into the **Bearer** auth field in the docs. "Test Request" then sends `Authorization: Bearer <token>`.

The docs are served whenever `NODE_ENV` isn't `production`. To serve them in production (including the Docker image, which sets `NODE_ENV=production`), set `API_DOCS=true`.

Request bodies come from the DTO classes through the swagger CLI plugin (`nest-cli.json`), so a DTO's field types, `class-validator` rules and JSDoc comments show up without extra decorators. Response schemas aren't documented yet.

## Tests

```bash
pnpm --filter api test        # unit
pnpm --filter api test:e2e    # smoke: docs spec + auth guard (no database needed)
pnpm --filter api test:int    # integration: needs Postgres, uses the money_flow_test DB
```
