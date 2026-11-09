# Database Migration and Legacy Cutover Plan

Status: **proposal only — nothing in this document has been applied.**

The live database currently has:

- no `public._prisma_migrations` table
- no `prisma/migrations` directory
- a schema that matches `prisma/schema.prisma` but was applied outside Prisma Migrate

Do **not** run `prisma migrate dev`, `prisma migrate reset`, or `prisma db push` against this
database. They can drop or rewrite data and would invent migration history that does not exist.

---

## 1. Files in this plan

| File                                                | Purpose                                               | Writes? |
| --------------------------------------------------- | ----------------------------------------------------- | ------- |
| `prisma/sql/001_debit_cards_ownership.sql`          | Add explicit `debit_cards.user_id` + composite FK     | Yes     |
| `prisma/sql/002_legacy_import_metadata.sql`         | Create import map + issue tables                      | Yes     |
| `prisma/sql/003_legacy_entries_exits_to_ledger.sql` | Copy legacy entries/exits into transactions/movements | Yes     |
| `prisma/sql/004_reconciliation.sql`                 | Read-only verification queries                        | No      |
| `prisma/sql/005_reversal_uniqueness.sql`            | Unique reversal marker index                          | Yes     |
| `scripts/legacy-audit.cjs`                          | Read-only audit of ownership + migration completeness | No      |

Each write file wraps its statements in `BEGIN` / `COMMIT`. Review the file before running it.

---

## 2. Pre-flight checklist

1. **Back up the database** or create a branch database.
2. Record baseline counts:

```sql
SELECT 'users', count(*) FROM public.users
UNION ALL SELECT 'accounts', count(*) FROM public.accounts
UNION ALL SELECT 'transactions', count(*) FROM public.transactions
UNION ALL SELECT 'account_movements', count(*) FROM public.account_movements
UNION ALL SELECT 'transfers', count(*) FROM public.transfers
UNION ALL SELECT 'entries', count(*) FROM public.entries
UNION ALL SELECT 'exits', count(*) FROM public.exits;
```

3. Run the read-only audit:

```bash
node scripts/legacy-audit.cjs
```

4. Confirm the API build and tests pass:

```bash
pnpm run build
pnpm run test
pnpm run test:e2e
```

5. Coordinate a maintenance window. The importer preserves legacy rows, but it inserts ledger
   rows and should not run concurrently with legacy writes.

---

## 3. Step 1 — Explicit debit-card ownership (optional but recommended)

```bash
pnpm exec prisma db execute \
  --file prisma/sql/001_debit_cards_ownership.sql \
  --schema prisma/schema.prisma
```

What it does:

- adds `debit_cards.user_id`
- backfills it from the parent account
- aborts if a card has no owner
- replaces the single-column FK with `(account_id, user_id) → accounts(id, user_id)`
- adds `idx_debit_cards_user_account`

After applying, update `prisma/schema.prisma` to match:

```prisma
model debit_cards {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  account_id String   @db.Uuid
  user_id    String   @db.Uuid
  name       String   @db.VarChar(100)
  last4      String?  @db.Char(4)
  created_at DateTime @default(now()) @db.Timestamptz(6)
  accounts   accounts @relation(fields: [account_id, user_id], references: [id, user_id], onDelete: Cascade, onUpdate: NoAction, map: "fk_debit_cards_account")

  @@index([account_id], map: "idx_debit_cards_account")
  @@index([user_id, account_id], map: "idx_debit_cards_user_account")
}
```

Then:

```bash
pnpm exec prisma generate
pnpm run build
```

Keep the application code as-is: it already scopes cards through `accounts.user_id`, so it works
both before and after this migration.

---

## 4. Step 2 — Import metadata tables

```bash
pnpm exec prisma db execute \
  --file prisma/sql/002_legacy_import_metadata.sql \
  --schema prisma/schema.prisma
```

Creates:

- `public.legacy_ledger_import` — one row per imported legacy row; primary key
  `(source_table, source_id)` makes reruns idempotent.
- `public.legacy_ledger_import_issues` — rows that need manual review.

The map has `FOREIGN KEY (transaction_id, user_id) ON DELETE RESTRICT`. Imported transactions
therefore cannot be hard-deleted while the map row exists. Use reversals for imported rows.

These two tables are intentionally not declared in `prisma/schema.prisma` yet. Add Prisma models
only if application code needs typed access; the SQL scripts and audit tool use raw SQL.

---

## 5. Step 3 — Import legacy entries and exits

```bash
pnpm exec prisma db execute \
  --file prisma/sql/003_legacy_entries_exits_to_ledger.sql \
  --schema prisma/schema.prisma
```

### Import rules

- `entries` → `transactions.type = 'income'`
- `exits` → `transactions.type = 'expense'`
- `occurred_at` = legacy `date` at 00:00 UTC
- `transactions.created_at` = legacy `created_at` (preserves same-day ordering)
- one `account_movements` row per legacy row
- movement signs follow `src/ledger/ledger-rules.ts`:
  - income: asset `+`, credit card `-`
  - expense: asset `-`, credit card `+`

### Skipped rows

A legacy row is not imported when:

- `account_id` is `NULL`, missing, or belongs to another user
- its category is missing, belongs to another user, or has the wrong type

Those rows are recorded in `legacy_ledger_import_issues` with a reason and detail. No legacy row is
modified or deleted. Fix the source data, then rerun `003`; already imported rows are skipped.

### Rerunning

`003` is idempotent:

```sql
WHERE NOT EXISTS (
  SELECT 1 FROM public.legacy_ledger_import m
  WHERE m.source_table = 'entries' AND m.source_id = e.id
)
```

A rerun imports only rows that were not previously mapped.

---

## 6. Step 4 — Reconcile

Run the read-only audit:

```bash
node scripts/legacy-audit.cjs
```

Then run the SQL report:

```bash
pnpm exec prisma db execute \
  --file prisma/sql/004_reconciliation.sql \
  --schema prisma/schema.prisma
```

Expected results:

- imported entry/exit counts equal the legacy counts, or every missing row has an issue
- amount deltas are `0.00`
- all ownership mismatch checks return `0`
- no transactions without movements
- no self-transfers, negative fees, or credit-card sources
- every credit-card account has metadata
- no duplicate reversal markers

Review every row in `legacy_ledger_import_issues` and resolve it manually. Do not delete legacy
rows to make checks pass.

---

## 7. Step 5 — Reversal uniqueness

After confirming there are no duplicate reversal markers:

```bash
pnpm exec prisma db execute \
  --file prisma/sql/005_reversal_uniqueness.sql \
  --schema prisma/schema.prisma
```

This adds a partial unique expression index on `(user_id, reversal target)` for
`type = 'adjustment' AND description LIKE 'reversal_of:%'`. A concurrent duplicate reversal then
fails with Prisma `P2002`, which the global filter returns as HTTP `409`.

---

## 8. Cutover

1. Freeze or redirect legacy writes (`/entries`, `/exits`) from clients.
2. Run `003` one final time to catch rows written during the transition.
3. Run `scripts/legacy-audit.cjs` and `004_reconciliation.sql` again.
4. Switch dashboard/report consumers to `/reports`, `/transactions`, and `/transfers`.
5. Keep legacy tables and routes read-only for a defined observation period.
6. Only after the observation period, and with a fresh backup, plan dropping legacy routes,
   columns, and tables in a separate reviewed migration.

### Rollback

- `001`, `002`, `003`, and `005` are additive. To roll back an _import only_, delete the
  `legacy_ledger_import` rows first (they reference the transactions), then delete the imported
  `transactions` (their movements cascade). Do it inside a transaction and keep legacy rows:

  ```sql
  BEGIN;
  DELETE FROM public.legacy_ledger_import
  WHERE transaction_id IN (/* imported transaction ids */);
  DELETE FROM public.transactions
  WHERE id IN (/* imported transaction ids */);
  COMMIT;
  ```

- To roll back `001`, drop `fk_debit_cards_account`, restore
  `debit_cards_account_id_fkey` on `account_id`, drop `idx_debit_cards_user_account`, and drop
  `debit_cards.user_id`.
- To roll back `005`, drop `uq_reversal_marker`.
- Take a backup before any rollback. The API still works without `001` because ownership is
  enforced through the account join.

---

## 9. Prisma Migrate baseline (only if you adopt Prisma Migrate)

Because no migration history exists, do not use `migrate dev` first. A safe baseline process is:

1. Work on a branch database that already matches `prisma/schema.prisma`.
2. Create a baseline migration directory with the current schema.
3. Mark it as applied with `prisma migrate resolve --applied <baseline>` on each environment.
4. Review and apply future migrations normally.

This is an operational decision and was **not** performed here. The SQL files above are portable
and can be applied with `prisma db execute` regardless of whether you adopt Migrate.

---

## 10. Known gaps to decide before cutover

| Gap                                    | Decision needed                                                |
| -------------------------------------- | -------------------------------------------------------------- |
| Debit cards without explicit `user_id` | Apply `001` or accept account-join enforcement                 |
| Imported rows and hard delete          | Keep `ON DELETE RESTRICT` and reverse, or change to `CASCADE`  |
| Legacy rows without an account         | Fix source data or import with a designated account            |
| Category type mismatches               | Fix source data; the importer skips them                       |
| Reversal concurrency                   | Apply `005`                                                    |
| UTC vs local reporting                 | Define the product timezone before freezing historical reports |
| Legacy table retirement                | Define an observation window and a separate drop plan          |
