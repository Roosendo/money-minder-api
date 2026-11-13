# Money Minder API — Test Plan

> **Scope.** Every endpoint, every service function, and every validation rule worth a test, with the
> conventions already decided. Produced from `docs/BACKEND_API.md`, `prisma/schema.prisma`, the
> Swagger/OpenAPI route inventory (87 routes / 16 controllers) and a line-by-line read of every
> controller, service and DTO. The pre-existing spec files were deliberately not consulted — treat
> this document as the source of truth when reconciling them.
>
> **Worked example.** `test/accounts.e2e-spec.ts` (13 passing tests) is the canonical e2e template.
> Copy its bootstrap, seed and cleanup verbatim into every new e2e file.

---

## 1. Commands & stack

| What          | Command                          | Location / config                                          |
| ------------- | -------------------------------- | ---------------------------------------------------------- |
| Unit tests    | `pnpm test`                      | jest config in `package.json`, `rootDir: src`, `*.spec.ts` |
| E2E tests     | `pnpm test:e2e [nameFilter]`     | `test/jest-e2e.json`, `*.e2e-spec.ts`, `@/` → `../src/`    |
| Coverage      | `pnpm test:cov`                  | outputs to `../coverage`                                   |
| Lint / format | `pnpm run lint` / `pnpm run fmt` | oxlint / oxfmt (lefthook runs them pre-commit)             |

Already installed: `@nestjs/testing` ^12, jest 30.5, ts-jest 29.4, supertest 7.2 + `@types/supertest`.

**Facts you need when writing tests:**

- E2E tests are **self-contained**: they bootstrap the full `AppModule` in-process (no running dev
  server needed) and hit the **real database** from `.env` (`DATABASE_URL`).
- **Import gotcha (verified):** the repo tsconfig has `allowSyntheticDefaultImports` but **no
  `esModuleInterop`**, and ts-jest's effective options make a namespace import of supertest
  non-callable. Use the import-require form — `import request = require("supertest");` — exactly as
  in the example file. `import * as request` fails to compile.
- First e2e compile of the full app graph takes ~25 s; the example sets `jest.setTimeout(30000)`.
  Keep `closeBetterAuthInstance()` in `afterAll` — without it Jest hangs on Better Auth's pg pool.
- Run one file at a time while developing: `pnpm test:e2e transactions`.

---

## 2. The two test styles (decided conventions)

### Style A — unit tests (`src/<feature>/<name>.spec.ts`)

Plain jest, colocated with the code, **no HTTP, no database**. Instantiate services directly with
mocked dependencies (`new TransactionsService(mockPrisma, mockLedger)`), or use `Test.createTestingModule`
with `overrideProvider` when DI shape matters.

Belongs here: every pure function, every `throw` branch, DTO constraint matrices, the exception
filter, and anything whose branch density is too high to exercise through HTTP.

### Style B — e2e tests (`test/<feature>.e2e-spec.ts`)

One file per controller, full `AppModule`, real DB, supertest against `app.getHttpServer()`.
Bootstrap = copy of `test/accounts.e2e-spec.ts` (global prefix + `ValidationPipe` + `AllExceptionsFilter`
replicated from `src/main.ts`; `BigIntInterceptor` comes free with `AppModule`).

Belongs here: HTTP contract — status codes, error envelope, exact messages, money serialization,
ownership `404`, pagination, ledger effects on balances.

**Decision rule:** _if the branch needs SQL → B; if it's a rule on inputs/exceptions → A; core money
flows get both_ (unit for the sign matrix, e2e for the resulting balances).

**Per-file conventions:**

- Every e2e file carries exactly **one 401 test** (no token) and **one unknown-field 400 test**
  (skip the 400 where the route binds primitive query params instead of a DTO — see §3.6).
- Every e2e file seeds **its own user** (random-UUID email) + bearer session and cleans up in
  `afterAll`. Never depend on rows another test file created.
- Assertions use `toMatchObject` for envelopes and **exact string equality for money and messages**.

### Planned volume (estimates, ±20 %)

| Area (e2e file)              | Endpoints | E2E cases | Unit spec file(s)                                                            | Unit cases |
| ---------------------------- | --------- | --------- | ---------------------------------------------------------------------------- | ---------- |
| `smoke` (app/health/phrases) | 4         | 7         | `phrases.service.spec`                                                       | 4          |
| `auth`                       | 4         | 7         | `auth.service.spec`                                                          | 5          |
| `users`                      | 2         | 6         | `users.service.spec`                                                         | 5          |
| `categories`                 | 4         | 12        | `categories.service.spec`                                                    | 12         |
| `accounts` ✅ (13 done)      | 10        | 24        | `accounts.service.spec`                                                      | 14         |
| `debit-cards`                | 5         | 13        | (covered by `ownership.service.spec`)                                        | —          |
| `credit-cards`               | 9         | 26        | `credit-cards.service.spec`                                                  | 16         |
| `transactions`               | 7         | 32        | `transactions.service.spec`                                                  | 18         |
| `transfers`                  | 7         | 24        | `transfers.service.spec`                                                     | 12         |
| `reports`                    | 7         | 18        | `reports.service.spec`                                                       | 14         |
| `loans`                      | 8         | 16        | `loans.service.spec`                                                         | 8          |
| `reminders`                  | 5         | 11        | `reminders.service.spec`                                                     | 6          |
| `savings`                    | 5         | 11        | `savings.service.spec`                                                       | 6          |
| `specials`                   | 5         | 10        | —                                                                            | —          |
| ledger core                  | —         | —         | `ledger-rules`, `ledger.service`, `ownership.service`, `balances` (e2e only) | 55         |
| error handling               | —         | —         | `middlewares/errors.spec`                                                    | 10         |
| common helpers & DTO matrix  | —         | —         | `money`, `is-money`, `pagination`, per-DTO validation specs                  | 45         |
| **Total**                    | **87**    | **~217**  | **~19 spec files**                                                           | **~226**   |

≈ **440 cases** total, roughly 50/50 between the two styles: ~217 e2e (16 files) + ~226 unit (~19 files).

---

## 3. Cross-cutting contracts (assert these everywhere they apply)

### 3.1 Authentication

- Public routes (**no token ever required**): `GET /hello`, `GET /ping`, `GET /health`,
  `GET /api/docs` (prod only), `GET|POST|PUT|DELETE /api/v1/auth/*`, `GET /api/v1/auth/google`,
  `GET /api/v1/auth/github`, `GET /api/v1/phrases/daily-phrase`. Everything else → 401 without a token.
- Failure shape (exact): `401 { statusCode: 401, timestamp, path, message: "Unauthorized: Valid session or Bearer token required" }`.
- Two accepted credentials: a Better Auth session cookie, or `Authorization: Bearer <token>` whose
  **SHA-256 hex** matches `sessions.token_hash` with `expires_at > now()` (seed this — see example).
- Expired session row → same 401 (guard filters on `expires_at: { gt: now }`).
- `@Public()` bypasses the guard via the `Reflector`; there is no role/permission system to test.

### 3.2 Error envelope (`AllExceptionsFilter`, registered in `main.ts`)

Every error response is `{ statusCode, timestamp, path, message }`. Two shapes of `message`:

| Source                      | `message` type | Example                                                       |
| --------------------------- | -------------- | ------------------------------------------------------------- |
| `ValidationPipe` violations | **array**      | `["name should not be empty", "property x should not exist"]` |
| Any thrown `HttpException`  | **string**     | `"Account not found"`                                         |

Status mapping (unit-test each row in `middlewares/errors.spec.ts`):

| Condition                                                                              | Status  | `message`                                    |
| -------------------------------------------------------------------------------------- | ------- | -------------------------------------------- |
| `HttpException` (any Nest exception)                                                   | its own | extracted `message`                          |
| Prisma `P2025` (record not found on update)                                            | 404     | `"Requested record not found"`               |
| Prisma `P2002` (unique)                                                                | 409     | `"Duplicate entry for <target>"`             |
| Prisma `P2003` (foreign key)                                                           | 400     | `"Foreign key constraint failed"`            |
| Any other `PrismaClientKnownRequestError` (incl. `P2010` raw-query / bad uuid `22P02`) | 400     | `"Database operation failed"`                |
| Unknown error                                                                          | 500     | `"Internal server error"` (+ `logger.error`) |

### 3.3 Ownership = 404, never 403

Every "not yours" lookup filters by `user_id` and throws `NotFoundException` **deliberately** (anti-ID-probing).
Cross-user reads of accounts/transactions/transfers/cards/categories(loans/reminders/savings) must
assert `404` + the module's exact message — e.g. `"Account not found"`, `"Transaction not found"`,
`` `Loan <id> not found` ``. Never assert 403.

### 3.4 Money rules

- **Request:** money fields arrive as strings matching `/^\d+(\.\d{1,2})?$/` (signed variant adds
  `-?`), magnitude ≤ `9999999999.99`, positive unless the DTO passes `allowZero`/`signed`
  (`@IsMoney`). Non-string / 3 decimals / negative-where-not-signed → 400; custom per-field message
  exists for `openingBalance` (`"openingBalance must be a decimal string"`) — verified in the example.
- **Response:** money is always a **2-decimal string** (`money()` = `toFixed(2)`), and
  `BigIntInterceptor` stringifies `Prisma.Decimal`/`BigInt` on the way out.
- **Exceptions (documented quirks):** loans/savings/reminders accept money as JSON **numbers**
  (`@IsNumber`) and some responses differ within the same module — see §8.

### 3.5 Pagination

List endpoints bound to `PaginationDto` (or a subclass) return
`{ items, total, page, pageSize, totalPages }`, `page` default 1 (min 1), `pageSize` default 15
(min 1, max 100). Out-of-range → 400. `totalPages = Math.ceil(total / pageSize) || 1`.
Accounts history returns the variant `{ accountId, openingBalance, openingBalanceDate, items, total, page, pageSize, totalPages }`.

### 3.6 Query validation rules (easy to get wrong)

- Routes binding a **DTO class** (`@Query() dto`) enforce `whitelist + forbidNonWhitelisted`:
  an unknown query key → **400** (`property <x> should not exist`).
- Routes binding **named primitives** (`@Query("hard")`, `@Query("type")`) do **not**: extra query
  keys are silently ignored, and the value is not validated (`?type=bogus` reaches Prisma → 500, see §8).
- Boolean query params accept `true` / `"true"` / `"1"` (`@Transform(toBoolean)`); dates must be
  ISO 8601 (`@IsDateString`); numeric DTO fields are coerced (`@Type(Number)`).

### 3.7 Status codes & delete semantics

- `POST` → **201**, everything else → 200 (including all `DELETE`s).
- **Delete = soft by default:** accounts/credit-cards → `{ archived: true, id }`; transactions/transfers
  → an automatic **reversal** row (`type: "adjustment"`, `description: "reversal_of:<id>"`,
  `REVERSAL_PREFIX = "reversal_of:"`); only `?hard=true` performs a real delete
  (`{ deleted: true, ... }` / `{ deleted: true, transactionId }`).
- Hard-delete guards: account with movements/cards/transfers → 400
  `"Account has financial history or linked cards and cannot be hard-deleted; archive it instead"`;
  credit card with history/dependents → 400
  `"Credit card has ledger history or is used as a payment account; archive it instead"`;
  already-reversed transaction → 400 `"Reversed transactions cannot be hard-deleted; reverse the reversal instead"`.

### 3.8 Route prefix gotcha

Global prefix `api/v1` **excludes** `api`, `api/docs`, `hello`, `ping`, `health`. So smoke tests call
`/hello`, `/ping`, `/health` (no prefix) and `/api/v1/hello` must be **404**. All other e2e calls use
`/api/v1/...`.

---

## 4. E2E bootstrap template

Condensed from `test/accounts.e2e-spec.ts` — the full, working version is there.

```ts
const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
app = moduleRef.createNestApplication();

// 1-3 live in src/main.ts, NOT in AppModule — replicate them:
app.setGlobalPrefix("api/v1", {
  exclude: ["api", "api/docs", "api/docs/(.*)", "hello", "ping", "health"],
});
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
app.useGlobalFilters(new AllExceptionsFilter());
// BigIntInterceptor: already registered by AppModule (APP_INTERCEPTOR) — do not re-add.
await app.init();

prisma = app.get(PrismaService);
// Seed: users row + sessions row { token_hash: sha256(bearerToken), expires_at: +1h }
// ...tests: request(app.getHttpServer()).get("/api/v1/...").set(authHeader)...

// afterAll: delete seeded rows (users cascade accounts/sessions), then:
await closeBetterAuthInstance(); // from "@/auth/auth" — required for Jest to exit
await app.close();
```

Checklist for every new e2e file:

1. [ ] `import request = require("supertest")` (not `import * as`).
2. [ ] Global prefix + `ValidationPipe` + `AllExceptionsFilter` replicated.
3. [ ] Random-UUID seed user + bearer session (`sha256` hex into `sessions.token_hash`).
4. [ ] One 401 test, one unknown-field 400 test, one cross-user 404 test.
5. [ ] `afterAll` removes seed rows, calls `closeBetterAuthInstance()`, then `app.close()`.
6. [ ] No hardcoded UUIDs, no reliance on other files' data.

---

## 5. Endpoint checklists (Style B — e2e)

Legend: ✅ covered by `test/accounts.e2e-spec.ts` · ⚠ assert the observed value on first run (noted
in §8 where the behavior looks unintentional).

### 5.1 `test/smoke.e2e-spec.ts` — app, health, phrases (4 endpoints)

**`GET /hello`** · **`GET /ping`** · **`GET /health`**

- [ ] 200 with no auth: `"Hi there you fantastic person!"` / `"pong 🎾"` / `{ status: "ok" }`
- [ ] `GET /api/v1/hello` → **404** (proves the prefix exclusion)

**`GET /api/v1/phrases/daily-phrase`** (public)

- [ ] 200, body is `null` or `{ phrase, movie, character }` (strings)
- [ ] Second call same day returns the identical entry (daily index + 24 h cache)
- [ ] No 401

### 5.2 `test/auth.e2e-spec.ts` — auth (4 endpoints)

**`GET /api/v1/auth/me`**

- [ ] 401 without token (standard envelope/message)
- [ ] 200 with the seeded bearer → raw user row: `{ id, name, email, avatar_url, created_at, oauth_accounts: [] }`
      (snake_case — see §8)
- [ ] 401 when the seeded session's `expires_at` is in the past

**`GET /api/v1/auth/google`** · **`GET /api/v1/auth/github`** (public)

- [ ] `?callbackURL=https://evil.example` → **403** `{ message: "Invalid callback URL" }` (open-redirect guard; deterministic)
- [ ] No `callbackURL` → not 401/404; either a 3xx redirect or a JSON error — env-dependent
      (Better Auth with placeholder OAuth credentials), keep loose

**`ALL /api/v1/auth/*`** (Better Auth handler, public)

- [ ] Smoke: e.g. `POST /api/v1/auth/get-session` → response originates from Better Auth
      (JSON, not the Nest envelope, not 401-from-Nest)
- [ ] OAuth callback rounds are **out of scope** (need a real provider) — manual

### 5.3 `test/users.e2e-spec.ts` — users (2 endpoints)

**`GET /api/v1/users/me`**

- [ ] 401 without token · [ ] 200 with seeded bearer → `{ id, name, email, avatar_url, created_at }`

**`PATCH /api/v1/users/me`**

- [ ] 200 updating `name`, and separately `avatarUrl` → persists (`avatar_url` in DB)
- [ ] `{}` → 200 no-op
- [ ] Unknown body key → 400 (array message, `property ... should not exist`)
- [ ] 401 without token

### 5.4 `test/categories.e2e-spec.ts` — categories (4 endpoints)

**`GET /api/v1/categories`**

- [ ] 401 · [ ] 200 returns own **and** global (`user_id: null`) categories, ordered by name asc
- [ ] `?type=income` filters by type; `?type=expense` likewise
- [ ] Cache: after a `POST`, the very next `GET` contains the new category (write invalidation)
- [ ] ⚠ `?type=bogus` → 500 today (raw `@Query("type")`, no pipe) — see §8

**`POST /api/v1/categories`**

- [ ] 201, `name` trimmed, `type` echoed; duplicate names allowed (no unique constraint)
- [ ] `name: ""` → 400 · `type: "bogus"` → 400 (enum) · unknown body key → 400
- [ ] ⚠ `name` > 100 chars → DB-level failure (no `@MaxLength`) — see §8

**`PATCH /api/v1/categories/:id`**

- [ ] 200 rename (trimmed) + type change, persists
- [ ] Other user's id → 404 `"Category not found or not editable"`
- [ ] Global category (seed one with `user_id: null`) → 404 (not editable)
- [ ] `name: ""` → 200 but **no change** (falsy ignored — current behavior)
- [ ] Malformed uuid → 400 `"Database operation failed"`

**`DELETE /api/v1/categories/:id`**

- [ ] 200 `{ deleted: true }`, gone from `GET` (cache invalidated)
- [ ] Other user's / global → 404 `"Category not found or cannot be deleted"`
- [ ] Category referenced by a transaction → 400 `"Foreign key constraint failed"` (FK is `Restrict`)

### 5.5 `test/accounts.e2e-spec.ts` — accounts (10 endpoints) ✅ 13/24 done

Covered by the example: 401 ×2, validation 400 (array + custom money message), service 400
(credit-card redirect), 201 create with money strings, list, get-by-id, cross-user 404, nonexistent
404, malformed uuid 400, PATCH rename, archive-by-default, `?hard=true` delete + post-404.

Remaining:

**`GET /api/v1/accounts`** / **`GET /api/v1/accounts/balances`** (alias — same assertions)

- [ ] `?includeArchived=true` (and `"1"`) lists archived; default excludes them
- [ ] `?asOf=not-a-date` → 400 · unknown query key → 400

**`POST /api/v1/accounts`**

- [ ] `openingBalance: "-5"` → 400 custom message `"openingBalance must be a decimal string"`
- [ ] `name` > 100 chars → 400 · `type: "bogus"` → 400

**`PATCH /api/v1/accounts/:id`**

- [ ] `openingBalance: "-1"` → 400 `"Opening balance cannot be negative"` (service guard)
- [ ] `isActive: false` archives; GET list default then excludes it
- [ ] Cross-user PATCH → 404 · unknown body key → 400

**`POST /api/v1/accounts/:id/archive`**

- [ ] 200 `{ archived: true, id }`; idempotent (twice → 200 both times)
- [ ] Cross-user → 404

**`DELETE /api/v1/accounts/:id`**

- [ ] Cross-user → 404
- [ ] `?hard=true` on an account **with movements** → 400 `"Account has financial history or linked cards and cannot be hard-deleted; archive it instead"` (create a transaction first)

**`GET /api/v1/accounts/:id/balance`**

- [ ] Same as get-by-id; `?asOf=<past>` returns balance as of that instant (seed a dated transaction to prove the filter)

**`GET /api/v1/accounts/:id/balances`**

- [ ] Missing `from`/`to` → 400 (both required)
- [ ] `from > to` → 400 `"'from' must be before or equal to 'to'"`
- [ ] Happy: array of `{ day: "YYYY-MM-DD", balance }`, zero-filled for empty days, money strings

**`GET /api/v1/accounts/:id/transactions`**

- [ ] Envelope `{ accountId, openingBalance, openingBalanceDate, items, total, page, pageSize, totalPages }`
- [ ] `items[]` carry a running balance as 2-decimal strings, ordered by date
- [ ] `pageSize=101` → 400 · `page=0` → 400 · `?from`/`?to` window respected

### 5.6 `test/debit-cards.e2e-spec.ts` — debit cards (5 endpoints)

**`POST /api/v1/debit-cards`**

- [ ] 201 from a bank account; list shows it (ordered `created_at desc`)
- [ ] `accountId` of a non-bank account → 400 `"Debit cards can only be linked to bank accounts"`
- [ ] Archived account → 400 `"Account is archived"` · other user's account → 404 `"Account not found"`
- [ ] `last4: "12"` / `"abcd"` → 400 `"last4 must be exactly 4 digits"` · missing `accountId` → 400 · unknown key → 400

**`GET /api/v1/debit-cards`**

- [ ] Paginated envelope; `?accountId=<other user>` → 404; `pageSize=101` → 400; `page=0` → 400

**`GET /api/v1/debit-cards/:id`**

- [ ] 200 · cross-user → 404 `"Debit card not found"` · nonexistent uuid → 404 · malformed uuid → 400 `"Database operation failed"`

**`PATCH /api/v1/debit-cards/:id`**

- [ ] 200 rename / re-link to another bank account; re-link to a credit-card account → 400; archived target → 400
- [ ] Cross-user → 404 · `last4` invalid → 400

**`DELETE /api/v1/debit-cards/:id`**

- [ ] 200 `{ deleted: true, id }` · cross-user → 404 · 401 without token

### 5.7 `test/credit-cards.e2e-spec.ts` — credit cards (9 endpoints)

**`POST /api/v1/credit-cards`**

- [ ] 201; card appears in `GET /credit-cards`; creates both the `credit_card` account and details
- [ ] `openingBalance: "-1"` → 400 `"Opening debt cannot be negative"` · `creditLimit: "0"` → 400 (positive rule)
- [ ] `statementDay: 0` / `dueDay: 32` → 400 (bounds 1-31)
- [ ] `paymentAccountId` = other user's account → 404 `"Payment account not found"`
- [ ] `paymentAccountId` = another credit card → 400 `"A credit card cannot use another credit card as payment account"`
- [ ] `paymentAccountId` = archived account → 400 `"Payment account is archived"`
- [ ] `last4` malformed → 400 custom message · unknown key → 400

**`GET /api/v1/credit-cards`**

- [ ] Archived cards excluded by default, included with `?includeArchived=true`
- [ ] Money strings; ⚠ assert `creditLimit` / `outstandingDebt` / `availableCredit` keys (verify on first run)

**`GET /api/v1/credit-cards/purchases`** (all cards)

- [ ] 200 array; ⚠ same key set as `/:accountId/purchases`

**`GET /api/v1/credit-cards/:accountId`** · **`/summary`** · **`/purchases`**

- [ ] 200 / cross-user 404 `"Credit card not found"` / malformed uuid 400
- [ ] `summary`: statement/due cycle fields with fixed `statementDay`/`dueDay` (e.g. 15/20) — assert `dueDate` in the right month, cycle `startDate`/`endDate`
- [ ] `purchases`: `totalSpent` **excludes** reversal adjustments — create a purchase then reverse it and watch `totalSpent` drop (reversal detection parses `reversal_of:` prefix)
- [ ] `availableCredit = creditLimit − outstandingDebt` as 2-decimal strings

**`PATCH /api/v1/credit-cards/:accountId`**

- [ ] 200 rename / limit / days; `paymentAccountId: null` **clears** it; `paymentAccountId` reassignment re-runs all create guards (same 4 messages)
- [ ] Changing `openingBalance` moves `outstandingDebt` accordingly · cross-user → 404

**`POST /api/v1/credit-cards/:accountId/payments`**

- [ ] Payment reduces debt: `outstandingDebt` drops by `amount`; **fee does not reduce debt** (fee only debits the source account)
- [ ] Source movements: `from` leg = `-(amount + fee)`, card leg = `-amount` (via `/transfers` or account balance before/after)
- [ ] `fromAccountId` = a credit card → 400 (transfer source guard message) · same account → 400 `"Transfer source and destination must be different accounts"`
- [ ] Archived source → 400 `"Both transfer accounts must be active"` · other user's source → 404
- [ ] Missing/zero `amount` → 400

**`DELETE /api/v1/credit-cards/:accountId`**

- [ ] Default → `{ archived: true, id }`; `?hard=true` with no history → `{ deleted: true, id }`
- [ ] `?hard=true` with movements → 400 `"Credit card has ledger history or is used as a payment account; archive it instead"`
- [ ] Passing a **bank** account id → 400 `` `Account type 'bank' is not valid for this operation` `` · cross-user → 404

### 5.8 `test/transactions.e2e-spec.ts` — transactions (7 endpoints) — the core

Seed per file: one bank account, one credit-card account, an income category, an expense category.

**`POST /api/v1/transactions`** — ledger sign matrix (assert via `GET /:id/movements` **and** account balance deltas)

- [ ] income → asset: movement `+amount` · expense → asset: `−amount`
- [ ] income → credit card: `−amount` (debt down) · expense → credit card: `+amount` (debt up)
- [ ] adjustment + `direction: "increase"|"decrease"`: `+`/`−` on **both** account kinds
- [ ] adjustment without `direction` → 400 `"Adjustment transactions require a direction"`
- [ ] `type: "transfer"` → 400 (IsIn excludes it: `income, expense, adjustment`)
- [ ] `amount: "0"` / `"-5"` → 400 (positive money rule) · `description` > 500 → 400 · unknown key → 400
- [ ] archived account → 400 `"Account is archived"` · other user's account → 404 `"Account not found"`
- [ ] category type mismatch → 400 `` `Category 'Groceries' is a expense category, expected income` ``
- [ ] adjustment **with** a category → 400 `"Adjustment transactions cannot have a category"`
- [ ] other user's category → 404 `"Category not found"`; a **global** category works

**`GET /api/v1/transactions`**

- [ ] Paginated envelope; filters `type`, `categoryId`, `accountId`, `from`, `to`, `sortOrder=asc|desc`
- [ ] `includeReversed=false` hides reversed originals (⚠ `total` still counts them pre-filter — §8)
- [ ] Unknown query key → 400 (DTO-bound route) · `type=bogus` → 400 (enum, contrast with categories)

**`GET /api/v1/transactions/:id`** · **`/movements`**

- [ ] 200 with `reversalOf` (null or id parsed from `reversal_of:` prefix), `reversed` boolean, `affectsLiability`
- [ ] After reversing: original shows `reversalOf`/`reversed: true`
- [ ] `/movements` → array of `{ accountId, amount }` money strings
- [ ] Cross-user → 404 `"Transaction not found"` · malformed uuid → 400

**`PATCH /api/v1/transactions/:id`**

- [ ] Edit `amount` / `accountId` / `categoryId` / `occurredAt` / `description` → 200 + movements replaced
- [ ] Adjustment `direction` omitted → keeps direction implied by current movement sign
- [ ] Reversed transaction → 400 `"Reversed transactions cannot be edited"`
- [ ] Transfer-type transaction → 400 `"Use PATCH /transfers/:transactionId to edit transfers"`
- [ ] `amount: "0"` → 400 · archived target account → 400 · category mismatch → 400 (same template)
- [ ] Cross-user → 404

**`DELETE /api/v1/transactions/:id`** (default = reversal)

- [ ] 200 → a new `adjustment` transaction with `description = "reversal_of:<original id>"`, movements **negated**, account balance restored to pre-transaction value
- [ ] Original `GET` now reports `reversed: true`
- [ ] Second delete/reverse → 400 `"Transaction has already been reversed"`
- [ ] `?hard=true` on a non-reversed tx → `{ deleted: true, transactionId }`, movements cascade, balance restored
- [ ] `?hard=true` on a reversed tx → 400 `"Reversed transactions cannot be hard-deleted; reverse the reversal instead"`
- [ ] Reversing an already-reversed tx (reversal-of-reversal) → currently **allowed** (§8) — assert observed behavior

**`POST /api/v1/transactions/:id/reverse`**

- [ ] Same as DELETE default; `occurredAt` body overrides the reversal date
- [ ] Cross-user → 404 · missing body → 200 (DTO fully optional)

### 5.9 `test/transfers.e2e-spec.ts` — transfers (7 endpoints)

**`POST /api/v1/transfers`**

- [ ] 201; `from` movement `-(amount + fee)`, `to` movement `+amount` (asset→asset)
- [ ] `fee: "2.50"`: fee lands only on the source leg; fee surfaces in `GET` list items and reports' `transferFees`
- [ ] `fromAccountId === toAccountId` → 400 `"Transfer source and destination must be different accounts"`
- [ ] `amount: "0"` → 400 `"Transfer amount must be greater than zero"` · `fee: "-1"` → 400 (pipe)
- [ ] credit card as **source** → 400 `"Credit card accounts cannot be the source of a transfer; create a cash advance adjustment instead"`
- [ ] credit card as **destination** → allowed, card leg `−amount` (debt reduced)
- [ ] archived account on either side → 400 `"Both transfer accounts must be active"`
- [ ] other user's account → 404 `"Account not found"` · unknown key → 400

**`GET /api/v1/transfers`**

- [ ] Paginated; only `type: "transfer"` rows; `from`/`to`/`accountId`/`sortOrder` filters work; `fee` present per item

**`GET /api/v1/transfers/:transactionId`** · **`/movements`**

- [ ] 200 / cross-user 404 `"Transfer not found"` / malformed uuid 400
- [ ] `/movements` → exactly **two** movements with the signs above

**`PATCH /api/v1/transfers/:transactionId`**

- [ ] Edit `amount`/`fee`/`occurredAt`/`description` → 200, both legs recomputed
- [ ] Reversed transfer → 400 `"Reversed transfers cannot be edited"` · `amount: "0"` → 400 · cross-user → 404

**`DELETE /api/v1/transfers/:transactionId`** · **`POST .../reverse`**

- [ ] Default/reverse → reversal tx (`reversal_of:<id>`) with **both** legs negated; balances restored
- [ ] Double reversal → 400 already-reversed · `?hard=true` → `{ deleted: true }` + both movements gone
- [ ] Cross-user → 404 · 401 without token

### 5.10 `test/reports.e2e-spec.ts` — reports (7 endpoints)

All: 401 without token; unknown query key → 400 (every route is DTO-bound); money always 2-decimal strings.

**`GET /api/v1/reports/monthly?year&month`**

- [ ] 200 `{ period: { type: "monthly", year, month, from, to }, summary, expensesByCategory }`
- [ ] `from` = `YYYY-MM-01T00:00:00.000Z`, `to` = last instant of the month (UTC)
- [ ] `summary` = `{ from, to, income, expenses, transferFees, expensesIncludingTransferFees, net, adjustments, counts: { income, expenses, adjustments } }` with `net = income − expenses − transferFees`
- [ ] `month: 0|13` → 400 · `year: 1899` → 400

**`GET /api/v1/reports/yearly?year`**

- [ ] `{ period: { type: "yearly", ... }, summary, monthly, expensesByCategory }` and `monthly` always has **12** rows `{ month: "YYYY-MM", income, expenses, transferFees, net }` (empty months = `"0.00"`)

**`GET /api/v1/reports/range?from&to`**

- [ ] Missing `from`/`to` → 400 · happy → `{ period: { type: "custom", from, to }, summary, expensesByCategory }`
- [ ] ⚠ `from > to` → currently unvalidated (§8) — assert observed output

**`GET /api/v1/reports/expenses-by-category?from&to[&includeTransferFees]`**

- [ ] Rows `{ categoryId, categoryName, totalAmount, count }` ordered by total desc; uncategorized → `categoryName: "Uncategorized"`
- [ ] `includeTransferFees=true` appends `{ categoryId: null, categoryName: "Transfer fees", count: 1, isTransferFee: true }`

**`GET /api/v1/reports/account-balances[&asOf][&includeArchived]`**

- [ ] `{ asOf, accounts[], totals: { assets, creditCardDebt, netWorth } }` with `assets = Σ non-credit-card balances`, `creditCardDebt = Σ credit-card balances`, `netWorth = assets − debt`

**`GET /api/v1/reports/credit-cards`**

- [ ] `{ cards[], totals: { creditLimit, outstandingDebt, availableCredit } }`; archived cards excluded; `availableCredit = limit − debt`

**`GET /api/v1/reports/cash-flow?year[&sortOrder]`**

- [ ] Rows `{ month, total_ingresos, total_egresos, total_fees, balance }` (snake_case — §8), `sortOrder=asc` default, `desc` reverses

**Reversal exclusion (one dedicated test):** reverse an expense, then `monthly`/`yearly` — the original
expense disappears from `expenses` and the reversal shows up under `adjustments`.

### 5.11 `test/loans.e2e-spec.ts` — loans (8 endpoints)

**`POST /api/v1/loans`**

- [ ] 201 with defaults `interestRate: 0`, `status: "active"`; response `principal` is a **string** (`"1000.00"`, via interceptor) — see §8
- [ ] `principal: 0` → 400 (`Min(0.01)`) · `direction: "x"` → 400 · missing `startDate` → 400 · unknown key → 400

**`GET /api/v1/loans`**

- [ ] Array ordered `start_date desc`; here `principal`/`interestRate`/`totalPaid`/`remaining` are **numbers** (`Number()` conversion)
- [ ] `remaining = Math.max(0, principal − totalPaid)` after payments · `startDate`/`dueDate` are `"YYYY-MM-DD"`
- [ ] `lastFivePayments` ≤ 5 items, `paid_at desc`, each `{ id, amount, paidAt, note }`

**`GET /api/v1/loans/:loanId`**

- [ ] 200 (note: raw spread — `interest_rate` **snake_case**, dates ISO) · cross-user → 404 `` `Loan <id> not found` `` · malformed uuid → 400

**`PATCH /api/v1/loans/:loanId`**

- [ ] 200 edit fields; `dueDate: ""` clears to `null`; `principal: 0` → 400; cross-user → 404; cache invalidated (list reflects edit immediately)

**`DELETE /api/v1/loans/:loanId`**

- [ ] 200 `{ deleted: true }`; payments cascade (re-fetch → 404); cross-user → 404

**`POST /api/v1/loans/:loanId/payments`**

- [ ] 201/200; `amount: 0` → 400; `paidAt` defaults to now; **list reflects the payment immediately** (60 s cache must be invalidated)
- [ ] Cross-user loan → 404 · unknown key → 400

**`PATCH /api/v1/loans/:loanId/payments/:paymentId`** · **`DELETE ...`**

- [ ] 200 edit / `{ deleted: true }`; wrong `paymentId` → 404 `` `Payment <id> not found for loan <loanId>` ``; other user's loan → 404

### 5.12 `test/reminders.e2e-spec.ts` — reminders (5 endpoints)

**`POST /api/v1/reminders`**

- [ ] 201 with defaults `amount: null`, `recurrence: "none"`, `status: "pending"`; response `amount` is a **string** (`"50.00"`) when provided — §8
- [ ] Missing `dueAt` → 400 · `amount: -1` → 400 · `recurrence: "weekly"` → 400 · unknown key → 400

**`GET /api/v1/reminders`** — ordered `due_at asc`; new reminder appears immediately (cache invalidation)

**`GET /api/v1/reminders/:id`** — 200 / cross-user 404 `` `Reminder <id> not found` `` / malformed uuid 400

**`PATCH /api/v1/reminders/:id`**

- [ ] 200 edit; `amount: null` **clears** it; `status: "done"` persists; cross-user → 404; unknown key → 400

**`DELETE /api/v1/reminders/:id`** — 200 `{ deleted: true }`, gone from list; cross-user → 404; 401 test

### 5.13 `test/savings.e2e-spec.ts` — savings (5 endpoints)

**`POST /api/v1/savings`**

- [ ] 201; `currentAmount > targetAmount` → 400 `"Current amount cannot exceed target amount"`; equal values OK
- [ ] `targetAmount: 0` → 400 · unknown key → 400 · response money fields are strings (`"100.00"`) — input was a number (§8)

**`GET /api/v1/savings`** — ordered `name asc`; cache invalidated by writes

**`GET /api/v1/savings/:id`** — 200 / cross-user 404 `` `Saving <id> not found` `` / malformed uuid 400

**`PATCH /api/v1/savings/:id`**

- [ ] Lowering `targetAmount` below current → 400 (merged-values check); raising `currentAmount` above target → 400
- [ ] Cross-user → 404 · unknown key → 400

**`DELETE /api/v1/savings/:id`** — 200 `{ deleted: true }` + gone from list; cross-user → 404; 401 test

### 5.14 `test/specials.e2e-spec.ts` — specials (5 endpoints)

All: 401 without token, missing/invalid `year` → 400 (DTO bounds 1900-2100).

**`GET /api/v1/specials/financial-summary-yearly?year`**

- [ ] `{ year, totalEntries, totalExits, netBalance }`, money strings, `netBalance = totalEntries − totalExits`

**`GET /api/v1/specials/financial-summary-monthly?year&month`**

- [ ] `{ month, year, totalEntries, totalExits, netBalance }`; missing `month` → 400; `month: 13` → 400

**`GET /api/v1/specials/cash-flow?year`** — array keyed like reports cash-flow (`total_ingresos` …), transfer fees included

**`GET /api/v1/specials/yearly-categories?year`**

- [ ] `{ incomes: [{ categoryId, categoryName, totalAmount }], expenses: [...] }`; expenses include the `"Transfer fees"` row

**`GET /api/v1/specials/recent-transactions?year`**

- [ ] ≤ 15 items, only `income`/`expense`, **reversed excluded**, `{ id, type, amount, category, date: "YYYY-MM-DD", description, creditCard }`
- [ ] Uncategorized → `category: "General"` · no credit-card movement → `creditCard: null` · empty year → `[]`

---

## 6. Unit test checklists (Style A — `src/**/*.spec.ts`)

### 6.1 `src/ledger/ledger-rules.spec.ts` — the sign matrix (highest value)

- [ ] `movementForTransaction` full table: `income` asset `+` / liability `−`; `expense` asset `−` / liability `+`;
      `adjustment increase` `+` both; `adjustment decrease` `−` both
- [ ] `movementForTransaction(..., "transfer")` throws `"Use movementForTransfer for transfer transactions"`
- [ ] adjustment without direction throws `"Adjustment transactions require a direction (increase|decrease)"`
- [ ] `movementForTransfer`: `from` asset `-(amount+fee)`, `to` asset `+amount`, `to` liability `−amount`,
      `from` liability throws `"Credit card accounts cannot be the source of a transfer"`
- [ ] `isLiabilityAccount` / `isAssetAccount` for all 4 `account_type` values
- [ ] `computeAvailableCredit(limit, debt)` = `limit − debt` (Decimal, no floats) · `computeBalance` sums with opening
- [ ] `compareLedgerEntries` ordering: `occurredAt` → `createdAt` → `transactionId` → `movementId`

### 6.2 `src/ledger/ledger.service.spec.ts` (mock `tx`/prisma)

- [ ] `createInTransaction`: no movements → 400 `"A transaction must have at least one account movement"`;
      zero amount → 400 `"Transaction amount must be greater than zero"`; zero movement → 400 `"Account movements must not be zero"`
- [ ] `assertAccountsOwned`: unowned id → 404 `"Account not found"`; archived with `requireActive` → 400 `` `Account '<id>' is archived` ``; returns the type map
- [ ] `reverseTransaction`: creates `adjustment` with `description = "reversal_of:" + id`, negated movements, `occurred_at` override honored
- [ ] double reversal → 400 `"Transaction has already been reversed"`; tx without movements → 400 `"Transaction has no account movements to reverse"`; missing tx → 404
- [ ] `hardDeleteTransaction`: normal → `{ deleted: true, transactionId }` + cascade; reversed tx → 400 `"Reversed transactions cannot be hard-deleted; reverse the reversal instead"`; missing → 404
- [ ] `findReversedTransactionIds`: parses `reversal_of:<id>` and `reversal_of:<id>|suffix` into a `Set`
- [ ] `replaceMovementsInTransaction`: same empty/zero guards; deletes then re-creates
- [ ] `REVERSAL_PREFIX === "reversal_of:"` (exact)

### 6.3 `src/ledger/ownership.service.spec.ts` (mock prisma)

- [ ] `requireAccount`: not found → **404** `"Account not found"` (never 403 — assert the anti-probe intent in a comment)
- [ ] `requireActive` + archived → 400 `"Account is archived"` · `allowedTypes` mismatch → 400 `` `Account type '<x>' is not valid for this operation` ``
- [ ] `requireAssetAccount` with credit card → 400 `"A credit card account is not valid for this operation"`
- [ ] `requireCreditCardAccount`: ok path returns `{ account, details }`; missing details → 404 `"Credit card details not found"`
- [ ] `requirePaymentAccount`: credit-card source → 400 `"The payment account must be a cash, bank or savings account"`; self-payment → 400 `"A credit card cannot be its own payment account"`
- [ ] `requireCategory`: global (`user_id: null`) allowed; unowned → 404 `"Category not found"`; type mismatch → 400 template message
- [ ] `requireTransaction` / `requireTransfer` / `requireDebitCard` → 404 with exact messages (`"Transfer not found"` includes both accounts)

### 6.4 `src/middlewares/errors.spec.ts` (mock `ArgumentsHost`/`Response`)

- [ ] One case per row of the §3.2 status table, including `P2002` with array **and** string `meta.target`
- [ ] `HttpException` message extraction (string response vs `{ message }` object response)
- [ ] Unknown error → 500 `"Internal server error"` **and** `Logger.error` called with stack
- [ ] Envelope always contains `statusCode`, `timestamp`, `path`, `message`

### 6.5 `src/common/` specs

- [ ] `money.spec`: `money()` always `toFixed(2)` (incl. `"5" → "5.00"`, rounding edge), `dec/add/sub/sumMoney`, `isZero/isPositive/isNegative`, `MIN_MONEY`
- [ ] `is-money.validator.spec`: matrix of valid/invalid values (string required, 1-2 decimals, max `9999999999.99`, `positive`/`allowZero`/`signed` combos), default messages (both templates), custom `validationOptions.message` pass-through
- [ ] `pagination.dto.spec`: defaults via `plainToInstance` (`page=1`, `pageSize=15`), `pageSize=101` violation, `page=0` violation, string→number coercion
- [ ] **DTO matrix spec(s)** — for every DTO class in §5's modules: one happy path + one violation per decorator
      (`@IsUUID`, `@IsDateString`, `@IsEnum`, `@IsIn`, `@MaxLength`, `@Matches` last4, `@Min/@Max`, `@IsMoney`,
      `@Transform(toStringValue/toBoolean)`, `@Type(Boolean/Number)`), run through `validate(plainToInstance(Dto, raw))`.

### 6.6 Service specs (mock prisma + ledger + cache)

**`transactions.service.spec`**

- [ ] create: adjustment-direction guard, archived account, category-not-found, mismatch template, adjustment+category
- [ ] list: filter building for each query field; `includeReversed=false` path (documents the `total` quirk)
- [ ] update: reversed → 400, transfer → 400 `"Use PATCH /transfers/:transactionId to edit transfers"`, no-movements → 400, amount ≤ 0 → 400, adjustment direction defaulting from existing movement sign, `categoryId: null` clears
- [ ] remove: hard vs reverse delegation; reverse: `occurredAt` pass-through
- [ ] `resolveCategoryId` expected-type logic (skipped when `adjustment`)

**`transfers.service.spec`**

- [ ] Guards: same account, zero amount, negative fee, both-active, credit-card source (exact messages)
- [ ] Movement construction: `from -(amount+fee)`, `to ±amount` per account type; fee persisted on the `transfers` row
- [ ] `list` delegates to `transactions.list` with `type: "transfer"`, `includeReversed: true`

**`accounts.service.spec`**

- [ ] create: credit-card redirect 400, negative opening 400, defaults (`type "bank"`, `openingBalanceDate now`)
- [ ] update: negative opening 400, trim, `isActive` toggle
- [ ] `deleteAccount`: soft → archive; hard → the four history counts (movements/debit/credit/transfers) gate the 400
- [ ] `getDailyBalances`: `from > to` → 400 `"'from' must be before or equal to 'to'"`; date slicing
- [ ] `serializeBalance`: `outstandingDebt` null for non-cards, money strings everywhere
- [ ] `getHistory`: default `from` = epoch, `to` = now

**`credit-cards.service.spec`**

- [ ] create guards (negative debt, payment-account 404/400s), single-tx account+details creation
- [ ] `list` archived filter · `update` guards incl. `paymentAccountId: null` clears
- [ ] `remove`: type gate, history gate, archive-vs-hard branches
- [ ] `pay` delegation arguments (toAccountId, fee default `"0"`, description default `"Credit card payment"`)
- [ ] `getPurchasesRange`: cycle window math around `statementDay`/`dueDay`, **due-date month clamping** (day 31 in February), reversal exclusion via `reversal_of:` prefix parsing, `availableCredit` math

**`categories.service.spec`**

- [ ] Cache: `get` hit/miss keys (`categories_list_<user>_<type|all>`), `set` TTL 60 s, `invalidateCache` deletes `_all/_income/_expense`
- [ ] `findOrCreate`: case-insensitive match, global vs owned, creates on miss
- [ ] update → 404 `"Category not found or not editable"`; delete → 404 `"Category not found or cannot be deleted"`; falsy `name` ignored

**`reports.service.spec`** (mock `$queryRaw` fixtures)

- [ ] summary assembly: `net = income − expenses − transferFees`, counts mapping
- [ ] expense breakdown: `"Uncategorized"` fallback, `includeTransferFees` row, ordering
- [ ] monthly series: always 12 rows, zero-filled
- [ ] account balances: `assets`/`creditCardDebt`/`netWorth` math · credit-card report totals · cash-flow sort reversal

**`loans.service.spec`** · **`reminders.service.spec`** · **`savings.service.spec`**

- [ ] Create defaults and 404 message templates (`` `Loan <id> not found` `` etc.) for get/edit/delete/payments
- [ ] Loans: `totalPaid`/`remaining` math, `lastFivePayments` slice(0,5), `Number()` conversions, cache `del` on every write
- [ ] Savings: overdraw guard on create **and** on update with merged values (exact message)
- [ ] Reminders: `amount: null` clears, defaults (`recurrence: "none"`, `status: "pending"`), cache invalidation

**`users.service.spec`** · **`auth.service.spec`** · **`phrases.service.spec`**

- [ ] users: upsert branches (name/avatarUrl only when truthy), `getProfile` → 404 `"User not found"`
- [ ] auth: `getSession` → 401 `"Session not found or expired"`; `getProfile` → 401 `"User profile not found"`
- [ ] phrases: daily index `getDate() % length`, cache key `daily_phrase_<date>` TTL 24 h, empty list → `null`

**Not unit-tested:** `balances.service` (raw SQL — covered end-to-end in the accounts e2e file).

---

## 7. Test data & isolation

- **Database:** tests run against the real `DATABASE_URL` from `.env`. This is safe _because every
  file seeds a random-UUID user and removes it in `afterAll`_ (accounts/sessions/categories cascade or
  are explicitly deleted). Never hardcode a UUID; never assert on rows you didn't create.
  Optional improvement later: a dedicated `DATABASE_URL_TEST` + `test/jest-e2e.json` env override.
- **Bearer auth seed** (copy from the example):

  ```ts
  const bearerToken = `e2e-${randomUUID()}`;
  const tokenHash = createHash("sha256").update(bearerToken).digest("hex");
  await prisma.users.create({
    data: { id: userId, name: "...", email: `e2e-<file>-${userId}@test.local` },
  });
  await prisma.sessions.create({
    data: { user_id: userId, token_hash: tokenHash, expires_at: new Date(Date.now() + 3_600_000) },
  });
  ```

- **Cleanup order:** children first (explicit `sessions`/accounts), then `users` (cascades), then
  `closeBetterAuthInstance()`, then `app.close()`.
- **Caches** (categories/loans/reminders/savings/phrases) are per-process — cache-invalidation tests
  are valid inside one e2e file; don't try to observe them across files.
- **Seeding style:** prefer creating data _through the API_ when the test is about ledger effects
  (movements only exist via `LedgerService`); direct Prisma seeding is fine for ownership fixtures
  (other-user rows) and auth rows.

---

## 8. Known quirks — document current behavior first, fix later

Decide per item whether the test should pin the current behavior or whether you'd rather fix the code;
either way, do it **consciously**.

1. **`GET /api/v1/categories?type=<bogus>` → 500.** `@Query("type")` is a raw string with no pipe;
   the invalid enum reaches Prisma (`PrismaClientValidationError` is not a _known_ error) → falls to
   the filter's unknown branch → 500 `"Internal server error"`. Candidate fix: `ParseEnumPipe` → 400.
2. **`GET /api/v1/reports/range` with `from > to` is unvalidated** — no guard in `RangeReportDto` or
   the service; returns empty/zeroed data instead of 400.
3. **`includeReversed=false` still reports the unfiltered `total`** in `GET /transactions` (items are
   filtered after the count). Pin it or fix it — but a test must exist either way.
4. **Money types are inconsistent outside the ledger core:** loans/savings/reminders take money as
   JSON **numbers** (`@IsNumber`), and loans answer differently per endpoint — `POST/PATCH /loans`
   return `principal` as a **string** (raw row → `BigIntInterceptor`) while `GET /loans` returns it
   as a **number** (`Number()` conversion); `GET /loans/:id` also leaks snake_case `interest_rate`.
   Reminders/savings echo number input as string output (`"50.00"`).
5. **Mixed response naming:** `GET /users/me` returns the raw snake_case row (`avatar_url`,
   `created_at`) while accounts/transactions use camelCase; cash-flow rows use `total_ingresos` /
   `total_egresos` (Spanish, snake_case).
6. **Category `name` has no `@MaxLength(100)`** — over-long names pass the pipe and fail at the DB
   (status: ⚠ verify — likely 400 `"Database operation failed"`), which is a poor error for a
   predictable input.
7. **Malformed uuid path params → 400 `"Database operation failed"`** (Prisma `P2010`/`22P02`).
   Works, but the message is generic; pin it in one test per module, not per endpoint.
8. **No insufficient-funds check** on transfers/credit-card payments (balances may go negative) —
   presumably intentional (overdraft/credit); add one test documenting it so it can't regress silently.
9. **Reversal-of-reversal is allowed** by `reverseTransaction` (the double-reversal check only looks
   one level up), while hard-deleting it is blocked. Pin the observed behavior.
10. **`GETTransactionQueryDto` is defined but never wired** to a controller (`includeMovements` is
    dead) — either wire it or delete it; no test needed while it's dead.
11. **`GET /api/v1/accounts/:id/balances` requires `from` and `to`** while sibling endpoints default
    their dates — likely intentional (range endpoint), but the 400-on-missing behavior should be pinned.

---

## 9. Suggested writing order

1. **Unit first (fast feedback):** `ledger-rules.spec` → `ownership.service.spec` → `errors.spec` →
   `money`/`is-money`/`pagination` + DTO matrix → remaining service specs.
2. **E2E core:** `accounts` ✅ → `transactions` → `transfers` → `credit-cards` (these prove the money).
3. **E2E read paths:** `reports` → `specials` (they consume everything above).
4. **E2E CRUD:** `categories` → `debit-cards` → `loans` → `reminders` → `savings`.
5. **Smoke & auth:** `smoke` → `users` → `auth`.

Before committing: `pnpm test` (all unit), `pnpm test:e2e` (all e2e — new files are self-contained),
`pnpm run lint`, `pnpm run fmt`.
