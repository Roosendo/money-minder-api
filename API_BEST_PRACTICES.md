# Money Minder API — NestJS Best Practices Guide

A learning-oriented review of the current API with concrete, idiomatic NestJS
recommendations. Nothing here is applied yet — read, understand, then implement
at your own pace. Each section shows the current code, why it is a problem, and
the recommended shape.

---

## 1. RESTful Routing & Endpoint Design

### Current state

The API mixes resource endpoints with RPC-style "verb" endpoints:

| Method | Current URL | Notes |
|---|---|---|
| POST | `/api/entries/new-entry` | verb in URL |
| GET | `/api/entries/get-entries` | verb in URL |
| GET | `/api/entries/get-entries-by-category-monthly` | long, RPC-style |
| POST | `/api/credit-cards` | good (bare) |
| GET | `/api/credit-cards/purchases` | fine (sub-resource) |
| PATCH | `/api/credit-cards/:creditCardId` | good |
| GET | `/api/exits/get-exits` | verb in URL |
| POST | `/api/emails/send-email` | action, acceptable |
| GET | `/api/specials/financial-summary-yearly` | action, acceptable |
| GET | `/api/auth/google` | ok |
| GET | `/api/hello`, `/api/ping` | demo leftovers |

### Why REST conventions matter

1. **Predictability** — a client that knows `POST /api/entries` can guess
   `PATCH /api/entries/:id`. With `new-entry`/`get-entries` every endpoint must
   be documented individually.
2. **HTTP semantics for free** — `POST` create, `GET` read, `PATCH` update,
   `DELETE` delete. Verbs in the URL duplicate what the method already says.
3. **Resources have a lifecycle** — `:id` in the path enables cache headers,
   ETags, conditional requests, and cleaner logging.

### Recommended shape

```
api/v1/
  entries
    POST   /api/v1/entries                      create entry
    GET    /api/v1/entries                      list/filter entries
    GET    /api/v1/entries/summary/monthly      monthly breakdown
    GET    /api/v1/entries/summary/yearly       yearly total
  exits
    POST   /api/v1/exits
    GET    /api/v1/exits
    GET    /api/v1/exits/summary/monthly
  credit-cards
    POST   /api/v1/credit-cards
    GET    /api/v1/credit-cards
    PATCH  /api/v1/credit-cards/:creditCardId
    DELETE /api/v1/credit-cards/:creditCardId
    GET    /api/v1/credit-cards/:creditCardId/purchases
  loans
    POST   /api/v1/loans
    GET    /api/v1/loans
    PATCH  /api/v1/loans/:loanId
    DELETE /api/v1/loans/:loanId
    POST   /api/v1/loans/:loanId/payments
    PATCH  /api/v1/loans/:loanId/payments/:paymentId
    DELETE /api/v1/loans/:loanId/payments/:paymentId
  reminders
    POST   /api/v1/reminders
    GET    /api/v1/reminders
    PATCH  /api/v1/reminders/:id
    DELETE /api/v1/reminders/:id
  savings
    POST   /api/v1/savings
    GET    /api/v1/savings
    PATCH  /api/v1/savings/:id
    DELETE /api/v1/savings/:id
```

### How to implement

- In `main.ts`: `app.setGlobalPrefix('api/v1')`, then drop the literal `api/...`
  prefixes from every controller.
- `@Controller('entries')` + `@Post()` instead of `@Controller('api/entries')` +
  `@Post('new-entry')`.
- Add versioning so you can evolve the API without breaking consumers:
  ```ts
  app.enableVersioning({ type: VersioningType.URI })
  ```
- Only use "action" style paths for non-CRUD operations that don't fit a
  resource: `send-email`, `financial-summary-yearly` are legitimate.

---

## 2. Authentication & Authorization (highest priority)

### Problem A: every endpoint trusts a client-supplied `email`

Today the "who is the user" is decided by whatever email a client puts in the
query string or body:

```ts
// credit-cards.controller.ts
async getCreditCards(@Query() getCreditCardsDto: GetCreditCardsDto) { ... }
// GetCreditCardsDto: email comes from the query params
```

**Why it's broken:** any user can read/edit/delete **any other user's** financial
data by passing someone else's email. This is an **IDOR** (Insecure Direct
Object Reference) — one of the most common critical API vulnerabilities. Email
is not a credential; it's public knowledge.

**What to do (in order):**
1. Real login (OAuth is already there) issues a **JWT** signed on the server.
2. A global `AuthGuard` verifies the token and injects the authenticated user.
3. A `@CurrentUser()` parameter decorator replaces every `email` query param:
   ```ts
   @Get()
   async getCreditCards(@CurrentUser() user: User) {
     return this.creditCardsService.getCreditCards({ email: user.email })
   }
   ```
4. The service keeps receiving `email` — but it now comes from the **token,
   not the client**, so tampering is impossible.

### Problem B: user data is passed through the redirect URL

```ts
// auth.controller.ts
const frontendURL = `https://money-minder-xi.vercel.app/login?user=${encodeURIComponent(JSON.stringify(user))}`
res.redirect(frontendURL)
```

**Why it's broken:**
- The profile (name, email, photo) lands in the URL → visible in browser
  history, proxy logs, and server access logs.
- Anyone with the URL can impersonate that identity on your frontend.

**What to do:** the redirect should carry a **short-lived code or JWT**, never
the raw profile. Pattern: after OAuth succeeds, create/find the user, sign a
JWT, redirect to
`https://frontend/login?token=<jwt>` (JWT in the fragment `#token=...` is safer
— it is never sent to the server). The frontend stores it and sends
`Authorization: Bearer <token>` on every call.

### Problem C: `AuthService` returns strings instead of throwing

```ts
googleLogin(req: Request) {
  if (!req.user) return 'No user from google'
  return { user: req.user }
}
```

Returning `'No user from google'` means the route responds with **200 OK and a
string**, so the frontend cannot tell success from failure. The NestJS way:

```ts
import { UnauthorizedException } from '@nestjs/common'

googleLogin(req: Request) {
  if (!req.user) throw new UnauthorizedException('Google authentication failed')
  return { user: req.user }
}
```

The global `AllExceptionsFilter` already converts exceptions into proper JSON
with a status code — let it work for you.

### Problem D: `@Res()` bypasses NestJS features

```ts
googleAuthRedirect(@Req() req: Request, @Res() res: Response) { ... res.redirect(...) }
```

Using `@Res()` **without** `{ passthrough: true }` tells Nest "I'll handle the
response myself", which disables interceptors, filters, and `@HttpCode`. Since
you genuinely need `res.redirect()`, keep `@Res()` here — but know the tradeoff,
and prefer `@Res({ passthrough: true })` whenever you only need one native
response call and still want interceptors to run.

### Strategy hardening

```ts
// google.strategy.ts — current
callbackURL: 'https://money-minder-api-mqz9.onrender.com/api/google/redirect'
profile: any
```

- **Move `callbackURL` (and client IDs/secrets) to env vars.** Hardcoded URLs
  break local dev, preview deploys, and any future domain change.
- Replace `any` with the typed profile from `passport-google-oauth20`
  (as `GitHubStrategy` already does with `Profile`).
- The `validate()` methods build a user but **never persist it**. Tie the OAuth
  result into `UsersService` so every provider maps to the same `users` row.

---

## 3. Validation & DTOs

### Tighten the global `ValidationPipe`

`main.ts` currently registers a bare pipe:

```ts
app.useGlobalPipes(new ValidationPipe())
```

Recommended options:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,                // auto-convert types (string -> number, Date)
    whitelist: true,                // strip properties without decorators
    forbidNonWhitelisted: true,     // reject unknown properties (typo protection)
    transformOptions: { enableImplicitConversion: true }
  })
)
```

With `transform: true`, `@Query('month')` can be `number` instead of parsing
`+month` manually in every service.

### Use the right validators

```ts
// entries.dto.ts — current
@IsString() @IsNotEmpty()
date: string

// recommended
@IsDateString()
date: string
```

Also note `EditCreditCardDto` uses `@IsNotEmpty()` on `name` while declaring it
optional — a contradiction. Optional fields must use only `@IsOptional()`
+ type validators.

### One source of truth for the resource identity

```ts
// credit-cards.controller.ts — current
@Patch('/:creditCardId')
async editCreditCard(
  @Body() editCreditCardDto: EditCreditCardDto,   // has creditCardId inside
  @Param('creditCardId') creditCardId: string
) { ... }
```

`creditCardId` appears in **both** the path and the body. Keep the id only in
the path, and drop it from the DTO:

```ts
@Patch(':creditCardId')
async editCreditCard(
  @Param('creditCardId', ParseIntPipe) creditCardId: number,
  @Body() dto: EditCreditCardDto
) { ... }
```

`ParseIntPipe` turns the string param into a number and returns 400 for garbage
input — safer than `+creditCardId` coercion in the service.

### Fix a real DI bug while you're here

`auth.controller.ts` line 4 has:

```ts
import type { AuthService } from './auth.service'
```

NestJS resolves constructor dependencies at runtime from TypeScript's emitted
metadata (`emitDecoratorMetadata`). For that to work the class must be imported
as a **value**, not a type:

```ts
import { AuthService } from './auth.service'
```

This is exactly why Biome's `useImportType` rule must stay off for NestJS (see
the Biome section below).

---

## 4. Error Handling

### The current filter is a black box

```ts
// middlewares/errors.ts
catch(exception: unknown, host: ArgumentsHost) { ... }
```

- It catches **everything**, including programming errors, but never logs them —
  so you have no way to debug production failures.
- Non-HTTP exceptions get a hardcoded, misleading message.

Recommended shape:

```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const message = exception.getResponse()
      response.status(status).json({ statusCode: status, message, timestamp: new Date().toISOString() })
      return
    }

    // unexpected error: log with stack, return a generic 500
    this.logger.error(exception)
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
}
```

### Map Prisma errors to HTTP statuses

Wrap Prisma calls and translate known codes:

- `P2025` (record not found) → `NotFoundException` (404)
- `P2002` (unique constraint) → `ConflictException` (409)
- Validation from DB → `BadRequestException` (400)

```ts
try {
  return await this.prisma.credit_cards.update({ where: { credit_card_id: id }, data })
} catch (e) {
  if (e.code === 'P2025') throw new NotFoundException(`Credit card ${id} not found`)
  throw e
}
```

### Throw, don't return strings

Any `return 'No user from google'` style code (auth, services returning
`'error'`) should throw an `HttpException` subclass instead.

---

## 5. Data Layer & Prisma

### Schema health

Current schema (`prisma/schema.prisma`) highlights:

1. **Snake_case models** are unusual (Prisma convention is PascalCase names with
   `@@map("snake_case_table")`). It works, but the mixed naming spreads into
   your TypeScript (`prisma.credit_cards`). Consider renaming models to
   `CreditCard` with `@@map("credit_cards")` so TS code reads naturally.
2. **Missing indexes.** Every table filters by `user_email`, but none declares
   an index on it. Add `@@index([user_email])` on all child models — essential
   as data grows.
3. **Nullable inconsistency** — `money_entries.user_email` is `String?` while
   everything else is required. Decide: are entries ever anonymous? If not,
   make it required and stop passing `fullName` around.
4. **`credit_card_id`/`loan_id` in `money_exits`/`payments`** — the relation is
   right, but `onDelete: NoAction` means deleting a credit card with exits will
   fail. Use `onDelete: Cascade` or handle deletion in a transaction.

### Use transactions for multi-step writes

```ts
// entries.controller.ts — current (two separate writes, can half-fail)
await this.usersService.createUser(createUserDto)
return this.entryService.newEntry(createEntryDto)
```

If the entry insert fails, the user is still created. Wrap them:

```ts
await this.prisma.$transaction(async (tx) => {
  await tx.users.upsert({ where: { email }, update: {}, create: { email } })
  await tx.money_entries.create({ data: { ... } })
})
```

Note: `users.service.ts` already checks existence before create — that's what
`upsert` is for.

### Fix the N+1 in `getPurchasesRange`

`credit-cards.service.ts` loops over cards and issues a query **per card**. For
small counts that's fine; to scale it, use a single `groupBy`:

```ts
const rows = await this.prisma.money_exits.groupBy({
  by: ['credit_card_id'],
  where: { user_email: email, date: { gte: start, lte: end } },
  _sum: { amount: true }
})
```

Also double-check the cut-off date math — when `currentDay <= cutOffDate` the
range spans two months back, and boundary dates should use `gt`/`lt` at the
edges to avoid off-by-one overlaps.

### BigInt handling

The `BigIntInterceptor` converts BigInt ids to `Number` before JSON serialization
(this is required — `JSON.stringify` throws on BigInt). Keep in mind:
- `Number()` silently loses precision above 2^53 — fine for autoincrement ids,
  dangerous for `BigInt` money. Prefer `Decimal`/`Float` columns for amounts.
- Since the interceptor converts objects/arrays recursively but returns `Date`
  unchanged, dates pass through correctly. Don't mix raw BigInt values back
  into responses.

---

## 6. Caching — pick one mechanism

Today there are **two competing systems**:

```ts
// entries.service.ts
@CacheKey('entries')          // decorator-based — only works with CacheInterceptor
@CacheTTL(60 * 1000)
async getEntries(...) {
  const cacheData = await this.cacheManager.get(cacheKey)   // manual get/set
  ...
}
```

The `@CacheKey`/`@CacheTTL` decorators do **nothing** unless a global
`CacheInterceptor` is registered. The manual `cacheManager.get/set` is doing
all the real work, and it's copy-pasted in every method.

**Recommendation:** drop the decorators and centralize the manual pattern in one
small helper, or remove the manual code and add the interceptor:

```ts
// Option A — interceptor
// app.module.ts
providers: [{ provide: APP_INTERCEPTOR, useClass: CacheInterceptor }]
// service — auto caches based on path+query, auto invalidates on POST/PATCH/DELETE
@CacheTTL(60 * 1000)
async getEntries(dto: GetEntriesDto) { ... }
```

Whichever you choose:
- Invalidate cache keys consistently (you already do `del(`entries_${email}`)`
  — keep that pattern).
- `CacheModule.register({ ttl: 60 * 1000 })` — the `// seconds` comment is
  wrong; the value is in **milliseconds**. Fine as-is, just fix the comment.

---

## 7. Filtering, Pagination & Sorting

`getEntries` currently hardcodes `take: 15` with no way to page, filter by
category, or limit by date range.

### A reusable pagination DTO

```ts
export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize: number = 15
}
```

And a filter DTO for entries:

```ts
export class GetEntriesDto extends PaginationDto {
  @IsEmail() @IsNotEmpty() email: string
  @IsOptional() @IsString() category?: string
  @IsOptional() @IsDateString() from?: string
  @IsOptional() @IsDateString() to?: string
  @IsOptional() @IsString() sortBy?: 'date' | 'amount'
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc'
}
```

### Applying it in the service

```ts
async getEntries({ email, category, from, to, page, pageSize, sortBy, sortOrder }: GetEntriesDto) {
  const where = {
    user_email: email,
    ...(category && { category }),
    ...(from || to) && {
      date: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) })
      }
    }
  }

  const [items, total] = await this.prisma.$transaction([
    this.prisma.money_entries.findMany({
      where,
      orderBy: { [sortBy ?? 'entry_id']: sortOrder ?? 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    this.prisma.money_entries.count({ where })
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
```

Returning `{ items, total, page }` lets the frontend render pagination controls.
The same pattern applies to exits, reminders, savings, and credit cards.

---

## 8. Configuration & Environment

`src/common/configs/config.ts` barely reads the environment:

```ts
const config: Config = {
  nest: { port: +(process.env.PORT || '7373') },
  cors: { enabled: true }
}
```

- Add **typed env validation** at boot so a missing/mistyped variable fails fast.
  NestJS integrates with `Joi`, `zod`, or `class-validator`:

```ts
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    PORT: Joi.number().default(7373),
    DATABASE_URL: Joi.string().required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    GITHUB_CLIENT_ID: Joi.string().required(),
    GITHUB_CLIENT_SECRET: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    CORS_ORIGINS: Joi.string().default('')
  })
})
```

- **Move the hardcoded CORS origins out of `main.ts`** into `CORS_ORIGINS`
  (comma-separated) and build the array from `process.env`.
- Same for the strategy `callbackURL`s — derive them from env (or from the
  current request host).

---

## 9. Testing

Only `app.controller.spec.ts` exists today. At minimum add:

- **Unit tests** for the pure logic: cut-off range calculation in
  `getPurchasesRange`, monthly summary grouping, DTO validation.
- **e2e tests** (NestJS provides `supertest` via `@nestjs/testing`) for the happy
  path of each resource: create → get → patch → delete, and one auth-flow test.

Example unit test pattern:

```ts
describe('CreditCardsService', () => {
  it('calculates the cut-off window', () => {
    const service = new CreditCardsService(prismaMock, cacheMock)
    // inject mocked PrismaService + cache manager
  })
})
```

---

## 10. Biome configuration (the decorator error)

You hit `decorators are not valid here` from Biome in `auth.controller.ts`.
That is a **parser** error, not a lint rule. NestJS uses legacy
**parameter decorators** (`@Req()`, `@Res()`, `@Body()`), which Biome treats as
"unsafe" by default. The fix is a parser option, and it's now applied in
`biome.json`:

```json
"javascript": {
  "parser": { "unsafeParameterDecoratorsEnabled": true }
}
```

Two related guards are already in place too:

1. **`useImportType: "off"`** — the recommended preset promotes
   `import { X }` → `import type { X }`. With NestJS `emitDecoratorMetadata`
   that silently breaks dependency injection (see §3). `auth.controller.ts`
   already has the buggy `import type { AuthService }` — revert it to a value
   import.
2. `noExplicitAny` stays off because the Passport strategies intentionally use
   `any` for OAuth profiles (until you type them properly, §2).

After that, `pnpm check:write` / `pnpm format:write` should pass clean.

---

## Suggested implementation order

1. **Security first**: JWT + global AuthGuard + `@CurrentUser()`; stop trusting
   client emails; throw exceptions instead of returning strings; move OAuth
   secrets/callback URLs to env.
2. **Fix the DI bug**: value-import `AuthService`.
3. **Error handling**: logging filter + Prisma error mapping.
4. **Validation**: `ValidationPipe` options, correct DTO validators,
   path-vs-body id cleanup.
5. **Routes**: `setGlobalPrefix('api/v1')`, rename RPC endpoints to REST.
6. **Data**: indexes, `$transaction`, single-query summaries, pagination/filters.
7. **Caching**: settle on one mechanism, centralize the helper.
8. **Tests** as you refactor, section by section.
