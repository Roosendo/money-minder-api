# money-minder-api — AGENTS Guide

## Commands (use `pnpm`, not npm/yarn)

| Action             | Command                                                 |
| ------------------ | ------------------------------------------------------- |
| Install            | `pnpm install`                                          |
| Build              | `pnpm run build` (runs `prisma generate && nest build`) |
| Start              | `pnpm run start`                                        |
| Dev mode           | `pnpm run start:dev`                                    |
| Lint               | `pnpm run lint` (oxlint)                                |
| Format             | `pnpm run fmt` (oxfmt)                                  |
| Lint + fix         | `pnpm run lint:fix`                                     |
| Typecheck          | `pnpm run build` (tsc)                                  |
| Unit tests         | `pnpm run test`                                         |
| E2E tests          | `pnpm run test:e2e`                                     |
| Test with coverage | `pnpm run test:cov`                                     |
| Start prod         | `pnpm run start:prod`                                   |

## Project structure

- **Monorepo**: Single NestJS app under `src/`, modules in `src/<feature>/`
- **Entry point**: `src/main.ts` — bootstrap()
- **Module boundary**: Each feature has its own module under `src/<feature>/`, imported in `src/app.module.ts`
- **Paths alias**: `@/` maps to `src/` (defined in tsconfig.json). E.g. `import { Something } from "@/users/users.service"`.
- **Prisma schema**: `prisma/schema.prisma` — PostgreSQL. After changing schema, run `pnpm prisma generate` (or let `pnpm run build` do it).
- **Better Auth**: OAuth (Google/GitHub) + email/password. Env vars in `.env` (see below).
- **CORS**: Configured via `CORS_ORIGINS` env (comma-separated). Defaults include localhost + Vercel deploy URLs.
- **Global prefix**: `api/v1` (set in `src/main.ts:16`). Excludes: `api`, `api/docs`, `hello`, `ping`.
- **Swagger**: Available at `/api/docs` (src/main.ts:43).
- **Error handling**: `AllExceptionsFilter` registered globally (src/main.ts:31).

## Environment

Required `.env` variables (see `.env`):

- `DATABASE_URL` — PostgreSQL connection string for Prisma
- `BETTER_AUTH_API_KEY`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_PATH`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `PORT` / `NEST_PORT` — defaults to `7373`
- `CORS_ORIGINS` — optional, overrides CORS origins

## Key quirks & conventions

- **PrismaService** (`src/prisma.service.ts`) extends `PrismaClient` and manages its own `pg.Pool`. It implements `OnModuleInit`/`OnModuleDestroy` for connection lifecycle.
- **AuthGuard** (`src/auth/auth.guard.ts`): First tries Better Auth `auth.api.getSession()`, falls back to `prisma.sessions` table lookup by `token_hash`.
- **BigIntInterceptor** is registered as a global interceptor via `APP_INTERCEPTOR` in `app.module.ts:53-55`.
- **ValidationPipe** is global with `transform: true, whitelist: true, forbidNonWhitelisted: true` (src/main.ts:21-28).
- **Pre-commit hooks** (lefthook): run `pnpm exec oxlint {staged_files}` and `pnpm exec oxfmt {staged_files}` (lefthook.yml:1-10). Commit lint via `commitlint --edit {1}`.
- **No `auth` guard** on `/api/v1/hello` and `/api/v1/ping` — marked with `@Public()` decorator (`src/app.controller.ts:9,15`).
- **E2E tests** (`test/*.e2e-spec.ts`): require the app to be running. Config in `test/jest-e2e.json` maps `@/` to `src/`.
- **Unit tests** (`src/**/*.spec.ts`): jest config `testRegex: ".*\\.spec\\.ts$"` (package.json:86).
- **`postinstall`** hook runs `prisma generate` (package.json:10).
- **`lefthook install`** runs on `pnpm run prepare` (package.json:19).

## Database migrations

- Schema changes → run `pnpm exec prisma migrate save --name <name>` then `pnpm exec prisma migrate deploy`.
- Alternatively, `pnpm run build` calls `prisma generate` (not `prisma migrate`). For full migrations, use the Prisma CLI directly.
- Prisma Client is generated into `node_modules/.prisma/client/` (or `.prisma/client/`).

## Testing notes

- Unit tests live under `src/`; e2e under `test/`.
- `pnpm run test:cov` outputs to `../coverage` (relative to repo root).
- E2E tests need the server running; they hit real HTTP endpoints.
- Mock data / fixtures: none observed — tests use direct DB queries via PrismaService.
