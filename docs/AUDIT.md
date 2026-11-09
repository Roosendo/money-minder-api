# Backend Audit — Ledger, Ownership, and Legacy Safety

Date: 2026-11-09
Branch: `new-schema`
Database inspection: read-only

---

## 1. Executive summary

The API was migrated from a stale `credit_cards` / `credit_card_id` model to the unified ledger
defined in `prisma/schema.prisma`:

- accounts (assets and liabilities) + account movements
- transactions + transfers
- credit card metadata attached to credit-card accounts
- user-scoped categories with global defaults
- balances derived from `opening_balance + signed movements`
- reversal-based deletion with opt-in hard delete

The project now builds, the unit suite passes, and the e2e smoke suite passes. **No database
schema change or data migration was applied.** The legacy `entries` / `exits` tables and routes
remain intact and deprecated.

---

## 2. Starting state and findings

### Build

The repository did **not** build at the start. Several modules still referenced the removed
`credit_cards` table and `credit_card_id` columns. Those references were removed or rewritten.

### Database

The live schema matched `prisma/schema.prisma`, but the database had:

- **no `_prisma_migrations` table**
- **no `prisma/migrations` directory**
- schema apparently applied directly with SQL

Therefore no migration history was invented and no `prisma migrate` / `prisma db push` command was
run. Running `prisma migrate dev` or `prisma migrate reset` against this database would be unsafe.

### Data snapshot

| Item                      | Count |
| ------------------------- | ----- |
| Users                     | 1     |
| Accounts                  | 2     |
| Credit card accounts      | 1     |
| Credit card metadata rows | 1     |
| Ledger transactions       | 0     |
| Account movements         | 0     |
| Transfers                 | 0     |
| Legacy entries            | 1     |
| Legacy exits              | 3     |

Legacy data issues found:

- 1 legacy entry had `account_id = NULL`.
- No legacy account references crossed users.
- No credit card account lacked metadata.
- No ledger/transfer/credit-card ownership violations.

The read-only audit script (`scripts/legacy-audit.cjs`) currently reports 17/17 checks passed.
The one legacy entry without an account is not imported because the migration importer records it
as an issue instead of guessing an account.

---

## 3. Authentication and ownership

### Auth resolution

`AuthGuard` is registered globally through `APP_GUARD`.

1. It asks Better Auth for a session using the request headers (cookie or bearer).
2. If a Better Auth user is found, it maps by email to `public.users`, creating the local user if
   needed.
3. If Better Auth fails, it falls back to `public.sessions`:
   - the presented bearer token is SHA-256 hashed
   - the hash is compared to `sessions.token_hash`
   - the session must not be expired
4. Otherwise it returns `401`.

`@Public()` is limited to `/hello`, `/ping`, `/health`, the phrases endpoint, OAuth entry points,
and the Better Auth handler.

### Ownership rules

| Resource                                           | Ownership enforcement                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| Accounts                                           | `accounts.user_id = session user` + composite FKs                         |
| Movements                                          | `(account_id, user_id)` and `(transaction_id, user_id)` composite FKs     |
| Transactions                                       | always queried with `user_id = session user`                              |
| Transfers                                          | `(from_account_id, user_id)` and `(to_account_id, user_id)` composite FKs |
| Credit card details                                | `(account_id, user_id)` and `(payment_account_id, user_id)` composite FKs |
| Debit cards                                        | joined through `accounts.user_id` (explicit proposal in `001_*.sql`)      |
| Categories                                         | `user_id = session user OR user_id IS NULL`                               |
| Loans / reminders / savings / legacy entries/exits | scoped by `user_id` in service queries                                    |

No endpoint reads `user_id` from the client. A request for another user's object returns `404`,
not `403`, to avoid existence probing.

### Category rules

- Global categories (`user_id IS NULL`) are readable and usable by all users.
- A user's private category is usable only by that user.
- Another user's private category is treated as non-existent.
- Income transactions require `income` categories; expense transactions require `expense`
  categories.
- Adjustments cannot have a category.

---

## 4. Ledger correctness

### Signed movements

The rules are implemented once in `src/ledger/ledger-rules.ts` and covered by unit tests:

| Transaction          | Asset             | Credit card |
| -------------------- | ----------------- | ----------- |
| income               | `+`               | `-`         |
| expense              | `-`               | `+`         |
| adjustment increase  | `+`               | `+`         |
| adjustment decrease  | `-`               | `-`         |
| transfer source      | `-(amount + fee)` | rejected    |
| transfer destination | `+amount`         | `-amount`   |

### Atomicity

Creating a transaction, its movements, and its transfer metadata happens inside a single
`prisma.$transaction`. Editing a transaction replaces movements and updates the transaction in the
same DB transaction. A failure rolls everything back.

### Decimal safety

- Application arithmetic uses `Prisma.Decimal` from `@/common/money`.
- No JavaScript floating-point arithmetic is used for money.
- DTOs validate money strings with at most two decimals and a `Decimal(12,2)` range.
- The global `BigIntInterceptor` serializes both `Prisma.Decimal` and `BigInt` as strings.

### Balances

`BalancesService` computes:

```
balance = opening_balance + SUM(movements where occurred_at between opening_balance_date and asOf)
```

Historical running balances use a SQL window ordered by:

```
occurred_at, created_at, transaction id, movement id
```

The date filter is applied to the window input, so a requested range starts from the correct
cumulative balance. `balance_after` is not stored anywhere.

### Transfers and fees

- Transfers create one `transfer` transaction with two movements.
- Self-transfers are rejected in the service and by a DB check.
- Source and destination must be active and owned by the user.
- Credit cards cannot be transfer sources.
- Fees are stored on `transfers.fee`, deducted from the source, and reported separately.
- Transfer fees are never income/expense transactions.
- `summary.net` always subtracts fees; `includeTransferFees` only adds a fee line to the category
  breakdown.

### Credit cards

- A credit card is an account (`type = 'credit_card'`) plus `credit_card_details`.
- Opening debt cannot be negative.
- Outstanding debt = opening debt + signed movements.
- Available credit = limit − outstanding debt.
- Payments are transfers from an asset account to the card account.
- A card cannot be its own payment account or another card's payment account.
- Hard delete is blocked when the card has ledger history, transfers, or dependent cards.

### Reversals

- `DELETE` reverses by default.
- A reversal is an `adjustment` transaction with description `reversal_of:<original id>`.
- The original rows are never modified.
- Reports exclude the original when a reversal marker exists.
- Reversed transactions cannot be edited or reversed again.
- `?hard=true` is opt-in and blocked for already-reversed transactions.

### Concurrency caveat

The “already reversed?” check is not atomic. Two simultaneous reversal requests can both pass the
application check before either inserts. Proposal `prisma/sql/005_reversal_uniqueness.sql` adds a
partial unique expression index so the database rejects the second insert (mapped to HTTP `409`).

---

## 5. API and module changes

### Added

- `src/ledger/` — movement rules, balances, ownership checks, atomic write helpers
- `src/transactions/` — income/expense/adjustment CRUD and reversal
- `src/transfers/` — transfer CRUD, fees, reversal
- `src/reports/` — summary, monthly, yearly, range, categories, balances, cash flow
- `src/debit-cards/`
- `src/prisma.module.ts` — single global Prisma provider
- `src/common/money.ts`, `src/common/validators/is-money.validator.ts`

### Rewritten / hardened

- `accounts` — balance-backed responses, archive/hard-delete guards
- `credit-cards` — account-based cards, payments, debt/available credit
- `specials` — dashboard endpoints now read the ledger
- `entries` / `exits` — ownership checks hardened; deprecated
- `auth.guard.ts` — SHA-256 token hash fallback
- `big-int-interceptor` — decimals and BigInt as strings
- feature modules — use global `PrismaModule` instead of each creating a `PrismaService`

### Test setup

- `tsconfig.json` now includes Node and Jest types.
- Jest resolves the `@/`, `@middlewares/`, and `@config/` path aliases.
- Stale e2e specs (old routes and nonexistent `DATABASE_CLIENT`) were replaced with a current
  smoke suite. Authenticated e2e checks are enabled by setting `TEST_TOKEN`.

### Test results

| Suite                   | Result                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm run build`        | Pass                                                                                       |
| `pnpm run lint`         | Pass (no reported errors)                                                                  |
| `pnpm run test`         | Pass (see final run below)                                                                 |
| `pnpm run test:e2e`     | 6 passed, 2 skipped (authenticated tests need `TEST_TOKEN`)                                |
| `pnpm run audit:legacy` | 17/17 checks passed on the live DB (read-only)                                             |
| Read-only service smoke | Accounts, monthly report, card list, and running-balance SQL succeeded against the live DB |

The e2e suite boots the real `AppModule` and therefore needs a reachable `DATABASE_URL`. It does
not write data.

---

## 6. Legacy compatibility

- `public.entries` and `public.exits` are **not dropped**.
- Legacy routes still write those tables and continue to work.
- Legacy routes are deprecated and do not affect ledger balances or `/reports`.
- `/specials/*` now reads the ledger, so legacy rows are absent from dashboard totals until
  `prisma/sql/003_legacy_entries_exits_to_ledger.sql` is applied.
- The migration uses a permanent map (`legacy_ledger_import`) for idempotency and an issue table
  (`legacy_ledger_import_issues`) for manual resolution.
- No legacy row is deleted or rewritten by the migration.

---

## 7. Residual risks and open items

1. **Debit-card ownership is implicit.** `debit_cards` has no `user_id`; ownership is enforced by
   joining `accounts`. Proposal `001_debit_cards_ownership.sql` makes it explicit. Until applied,
   direct SQL inserts could create cross-user cards.
2. **No migration history.** The database has no `_prisma_migrations` table. Never run
   `prisma migrate dev`, `prisma migrate reset`, or `prisma db push` without a backup and a
   deliberate baseline plan.
3. **Legacy rows are not in the ledger yet.** Applying `003` is required before legacy data
   appears in ledger reports.
4. **Hard delete of imported transactions.** With the proposed map FK (`ON DELETE RESTRICT`),
   hard-deleting an imported transaction would fail at the database level. Use reversals for
   imported rows, or change the FK policy deliberately.
5. **Reversal concurrency.** The application check is not atomic; apply `005` before relying on
   strict single-reversal guarantees.
6. **Reversal marker collision.** Reports identify reversals by the `reversal_of:<uuid>` prefix.
   A user-authored adjustment description starting with that prefix could be misclassified.
   Validation does not forbid it.
7. **Timezone boundaries.** Monthly/yearly reports use UTC boundaries; credit card cycle dates use
   server-local calendar dates. Keep this in mind for users far from UTC.
8. **Credit card over-limit.** `availableCredit` can be negative; the model allows spending beyond
   the limit unless a UI/business rule prevents it.
9. **No overdraft rule.** Asset balances may go negative; only `opening_balance >= 0` is enforced.
10. **Money strings are a breaking API change.** Any consumer expecting numbers must be updated.
11. **Legacy migration SQL is not validated against the live database.** It is proposal-only and
    should be tested on a branch database first.
12. **Loans still use JavaScript numbers for computed money fields.** The loans module predates the
    ledger work and converts `principal`, payments, and remaining balances with `Number`. It is
    outside the ledger path but should be converted to decimal strings before it is treated as
    production money handling. Savings returns `Decimal` values (serialized as strings) but uses
    `Number` for its target/current comparison.

---

## 8. Recommended next steps

1. Back up the database and verify row counts.
2. Apply `001` on a branch database, update `prisma/schema.prisma`, run `prisma generate`, and
   test debit-card flows.
3. Apply `002` + `003`, run `004_reconciliation.sql` and `scripts/legacy-audit.cjs`, resolve all
   issues, then freeze legacy writes.
4. Apply `005` after confirming there are no duplicate reversal markers.
5. Run authenticated e2e tests with `TEST_TOKEN` and exercise a disposable test user end-to-end.
6. Only then consider dropping the legacy columns/tables.
