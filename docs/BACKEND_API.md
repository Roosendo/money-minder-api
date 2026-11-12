# Money Minder API — Backend Guide

Base URL (local): `http://localhost:7373`

All application routes use the global prefix **`/api/v1`**. The following routes are intentionally
outside the prefix:

| Route           | Purpose      |
| --------------- | ------------ |
| `GET /hello`    | Smoke test   |
| `GET /ping`     | Smoke test   |
| `GET /health`   | Health check |
| `GET /api/docs` | Swagger UI   |

Everything under `/api/v1` requires an authenticated session unless marked public
(`/api/v1/auth/*` OAuth entry points and Better Auth handler).

The deprecated `/api/v1/entries` and `/api/v1/exits` routes have been retired. Use
`/api/v1/transactions` for income, expenses, and adjustments. Transfers use
`/api/v1/transfers`.

---

## 1. Authentication

The API accepts either:

1. A Better Auth session cookie (`Cookie` header), or
2. A bearer token: `Authorization: Bearer <token>`.

`AuthGuard` first resolves the request through Better Auth. If that fails, it hashes the
presented bearer token with SHA-256 and compares it to `public.sessions.token_hash`, provided
the session has not expired.

The authenticated database user is always derived from the session. **No endpoint accepts a
`user_id` from the body, query string, or URL.**

| Method  | Path                                  | Description                                         |
| ------- | ------------------------------------- | --------------------------------------------------- |
| `GET`   | `/api/v1/auth/me`                     | Current database user profile                       |
| `GET`   | `/api/v1/auth/google?callbackURL=...` | Start Google OAuth                                  |
| `GET`   | `/api/v1/auth/github?callbackURL=...` | Start GitHub OAuth                                  |
| `*`     | `/api/v1/auth/*`                      | Better Auth handler (email/password, session, etc.) |
| `GET`   | `/api/v1/users/me`                    | Current user profile                                |
| `PATCH` | `/api/v1/users/me`                    | Update name/avatar                                  |

---

## 2. Money and dates

### Money

Money is always exchanged as a **decimal string** with two decimal places:

```json
{ "amount": "1250.00" }
```

Requests accept strings (preferred) or numbers; responses are always strings. Never parse these
values with `parseFloat` for arithmetic. Use a decimal library or integer cents on the client.

The previous API returned JSON numbers for `Decimal` columns. That is a breaking change: money
is now a string everywhere, and `BigInt` values are strings too.

### Dates

Use ISO-8601. `occurredAt`, `from`, `to`, and `asOf` accept date-time strings; date-only strings
are interpreted at UTC midnight.

### Error shape

```json
{
  "statusCode": 400,
  "timestamp": "2026-11-09T12:00:00.000Z",
  "path": "/api/v1/transactions",
  "message": "Account is archived"
}
```

Common statuses: `400` invalid operation, `401` unauthenticated, `404` resource not owned or not
found, `409` duplicate/conflict.

Ownership failures deliberately return **404**, not 403, so a user cannot probe another user's
resource IDs.

---

## 3. Core ledger semantics

### Account types

| Type                      | Nature    | Balance meaning             |
| ------------------------- | --------- | --------------------------- |
| `cash`, `bank`, `savings` | Asset     | Positive = money available  |
| `credit_card`             | Liability | Positive = outstanding debt |

### Signed movements

| Transaction               | Asset account     | Credit card account                 |
| ------------------------- | ----------------- | ----------------------------------- |
| `income`                  | `+amount`         | `-amount` (refund/credit)           |
| `expense`                 | `-amount`         | `+amount` (purchase increases debt) |
| `adjustment` + `increase` | `+amount`         | `+amount`                           |
| `adjustment` + `decrease` | `-amount`         | `-amount`                           |
| `transfer` source         | `-(amount + fee)` | not allowed                         |
| `transfer` destination    | `+amount`         | `-amount` (payment reduces debt)    |

Balances are always derived:

```
balance = opening_balance + SUM(account_movements.amount)
```

`balance_after` is never stored. Historical balances filter `transactions.occurred_at` from
`accounts.opening_balance_date` through the requested date, then compute a running window.

### Transfers and fees

Transfers are **not** income or expense. A `$20.00` transfer with a `$1.00` fee produces:

- Source asset account: `-21.00`
- Destination account: `+20.00` (`-20.00` if the destination is a credit card)
- `transfers.fee = 1.00`

The fee is reported separately as `transferFees` and can be included as a `"Transfer fees"`
pseudo-category in expense breakdowns. It never creates an income/expense transaction.

Credit cards cannot be the source of a transfer. To model a cash advance, use an adjustment on
the credit card plus a transfer/adjustment on the destination account.

### Reversals and deletion

Deleting a ledger entry means **reversing** it by default:

- `DELETE /transactions/:id` and `DELETE /transfers/:transactionId` create a compensating
  `adjustment` transaction with description `reversal_of:<original id>`.
- The original rows remain in place.
- Reports exclude the original via the reversal marker.
- Reversed entries cannot be edited or reversed again.
- `?hard=true` performs a real delete and is only intended for mistakes. Reversed transactions
  cannot be hard-deleted.

---

## 4. Accounts

| Method   | Path                                                          | Description                                        |
| -------- | ------------------------------------------------------------- | -------------------------------------------------- |
| `GET`    | `/api/v1/accounts`                                            | List accounts with current balances                |
| `GET`    | `/api/v1/accounts/balances`                                   | Same as above                                      |
| `POST`   | `/api/v1/accounts`                                            | Create cash/bank/savings account                   |
| `GET`    | `/api/v1/accounts/:id`                                        | Account with balance at `asOf`                     |
| `PATCH`  | `/api/v1/accounts/:id`                                        | Rename / edit opening balance / toggle active      |
| `POST`   | `/api/v1/accounts/:id/archive`                                | Archive                                            |
| `DELETE` | `/api/v1/accounts/:id`                                        | Archive by default; `?hard=true` deletes if unused |
| `GET`    | `/api/v1/accounts/:id/balance?asOf=`                          | Balance on a date                                  |
| `GET`    | `/api/v1/accounts/:id/balances?from=&to=`                     | Daily balance series                               |
| `GET`    | `/api/v1/accounts/:id/transactions?from=&to=&page=&pageSize=` | History with running balance                       |

Query options for list: `includeArchived=true|false`, `asOf=<ISO date>`.

### Create account

```http
POST /api/v1/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main checking",
  "type": "bank",
  "openingBalance": "1500.00",
  "openingBalanceDate": "2026-01-01T00:00:00.000Z"
}
```

`type` may be `cash`, `bank`, or `savings`. Use `/credit-cards` for credit card accounts.

### Account response

```json
{
  "id": "0f0f...",
  "name": "Main checking",
  "type": "bank",
  "openingBalance": "1500.00",
  "openingBalanceDate": "2026-01-01T00:00:00.000Z",
  "isActive": true,
  "movementsTotal": "-120.00",
  "balance": "1380.00",
  "outstandingDebt": null
}
```

For credit cards, `balance` and `outstandingDebt` both represent debt (positive = owed).

### History response

The history endpoint returns raw SQL column names:

```json
{
  "accountId": "0f0f...",
  "openingBalance": "1500.00",
  "openingBalanceDate": "2026-01-01T00:00:00.000Z",
  "items": [
    {
      "transaction_id": "abc...",
      "type": "expense",
      "occurred_at": "2026-01-05T00:00:00.000Z",
      "transaction_amount": "20.00",
      "description": "Coffee",
      "movement_id": "def...",
      "movement_amount": "-20.00",
      "running_balance": "1480.00"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 15,
  "totalPages": 1
}
```

Daily balances:

```json
[{ "day": "2026-01-01", "balance": "1500.00" }]
```

---

## 5. Categories

| Method   | Path                                      | Description               |
| -------- | ----------------------------------------- | ------------------------- |
| `GET`    | `/api/v1/categories?type=income\|expense` | Global + own categories   |
| `POST`   | `/api/v1/categories`                      | Create a private category |
| `PATCH`  | `/api/v1/categories/:id`                  | Update own category       |
| `DELETE` | `/api/v1/categories/:id`                  | Delete own category       |

Global categories (`user_id IS NULL`) are visible to every user. A user may reference a global
category or their own category, never another user's private category. Global categories cannot
be edited or deleted through these endpoints.

Category `type` must match the transaction type (`income` transaction → `income` category,
`expense` transaction → `expense` category). Adjustments cannot have a category.

---

## 6. Transactions

| Method   | Path                                 | Description                               |
| -------- | ------------------------------------ | ----------------------------------------- |
| `POST`   | `/api/v1/transactions`               | Create income/expense/adjustment          |
| `GET`    | `/api/v1/transactions`               | List with filters and pagination          |
| `GET`    | `/api/v1/transactions/:id`           | Get one                                   |
| `GET`    | `/api/v1/transactions/:id/movements` | Movements only                            |
| `PATCH`  | `/api/v1/transactions/:id`           | Edit and recalculate movements atomically |
| `DELETE` | `/api/v1/transactions/:id`           | Reverse by default; `?hard=true` deletes  |
| `POST`   | `/api/v1/transactions/:id/reverse`   | Explicit reversal                         |

### Create

```json
{
  "type": "expense",
  "amount": "42.50",
  "accountId": "account-uuid",
  "categoryId": "category-uuid",
  "description": "Groceries",
  "occurredAt": "2026-11-08T15:30:00.000Z"
}
```

Adjustments require `direction`:

```json
{
  "type": "adjustment",
  "amount": "100.00",
  "accountId": "credit-card-account-uuid",
  "direction": "decrease",
  "description": "Bank fee correction"
}
```

List query: `from`, `to`, `type`, `categoryId`, `accountId`, `sortOrder=asc|desc`,
`includeReversed=true|false` (default `true`), `page`, `pageSize` (max 100).

### Response

```json
{
  "id": "tx-uuid",
  "type": "expense",
  "amount": "42.50",
  "description": "Groceries",
  "occurredAt": "2026-11-08T15:30:00.000Z",
  "createdAt": "2026-11-09T10:00:00.000Z",
  "category": { "id": "cat-uuid", "name": "Food", "type": "expense" },
  "movements": [
    {
      "id": "movement-uuid",
      "accountId": "account-uuid",
      "amount": "-42.50",
      "account": {
        "id": "account-uuid",
        "name": "Main checking",
        "type": "bank",
        "isActive": true
      }
    }
  ],
  "transfer": null,
  "reversed": false,
  "reversalOf": null,
  "affectsLiability": false
}
```

`movements[].amount` is the signed ledger delta. It is not the transaction amount. Always use the
movement sign and the account type to reason about balances.

---

## 7. Transfers

| Method   | Path                                         | Description                              |
| -------- | -------------------------------------------- | ---------------------------------------- |
| `POST`   | `/api/v1/transfers`                          | Create transfer                          |
| `GET`    | `/api/v1/transfers`                          | List transfers                           |
| `GET`    | `/api/v1/transfers/:transactionId`           | Get one                                  |
| `GET`    | `/api/v1/transfers/:transactionId/movements` | Movements                                |
| `PATCH`  | `/api/v1/transfers/:transactionId`           | Update amount/fee/date/description       |
| `DELETE` | `/api/v1/transfers/:transactionId`           | Reverse by default; `?hard=true` deletes |
| `POST`   | `/api/v1/transfers/:transactionId/reverse`   | Explicit reversal                        |

### Create

```json
{
  "fromAccountId": "checking-uuid",
  "toAccountId": "savings-uuid",
  "amount": "20.00",
  "fee": "1.00",
  "description": "Savings top-up",
  "occurredAt": "2026-11-08T12:00:00.000Z"
}
```

Source and destination must differ and both must belong to the user and be active. A credit card
cannot be the source. The fee is optional and defaults to `"0.00"`.

The transfer response is the underlying transaction shape with a `transfer` object:

```json
{
  "id": "tx-uuid",
  "type": "transfer",
  "amount": "20.00",
  "transfer": {
    "transactionId": "tx-uuid",
    "fromAccountId": "checking-uuid",
    "toAccountId": "savings-uuid",
    "fee": "1.00"
  }
}
```

---

## 8. Credit cards

Credit cards are accounts with `type = "credit_card"` plus a `credit_card_details` row.

| Method   | Path                                        | Description                             |
| -------- | ------------------------------------------- | --------------------------------------- |
| `POST`   | `/api/v1/credit-cards`                      | Create card account + metadata          |
| `GET`    | `/api/v1/credit-cards`                      | List cards with debt/available credit   |
| `GET`    | `/api/v1/credit-cards/purchases`            | Current billing-cycle purchases         |
| `GET`    | `/api/v1/credit-cards/:accountId`           | One card                                |
| `GET`    | `/api/v1/credit-cards/:accountId/summary`   | Same as above                           |
| `GET`    | `/api/v1/credit-cards/:accountId/purchases` | Purchases for one card                  |
| `PATCH`  | `/api/v1/credit-cards/:accountId`           | Update card metadata/opening debt       |
| `POST`   | `/api/v1/credit-cards/:accountId/payments`  | Pay the card from an asset account      |
| `DELETE` | `/api/v1/credit-cards/:accountId`           | Archive; `?hard=true` deletes if unused |

### Create

```json
{
  "name": "Visa",
  "creditLimit": "3000.00",
  "statementDay": 15,
  "dueDay": 5,
  "last4": "4242",
  "openingBalance": "250.00",
  "openingBalanceDate": "2026-01-01T00:00:00.000Z",
  "paymentAccountId": "checking-uuid"
}
```

`openingBalance` is opening **debt** and cannot be negative. `paymentAccountId`, when provided,
must be a cash/bank/savings account owned by the user.

### Pay

```http
POST /api/v1/credit-cards/:accountId/payments
```

```json
{
  "fromAccountId": "checking-uuid",
  "amount": "100.00",
  "fee": "0.00",
  "occurredAt": "2026-11-09T00:00:00.000Z"
}
```

A payment is a transfer from an asset account to the credit card. The source decreases by
`amount + fee`; the card debt decreases by `amount`.

### Response

```json
{
  "id": "card-account-uuid",
  "accountId": "card-account-uuid",
  "name": "Visa",
  "type": "credit_card",
  "isActive": true,
  "last4": "4242",
  "creditLimit": "3000.00",
  "statementDay": 15,
  "dueDay": 5,
  "paymentAccountId": "checking-uuid",
  "paymentAccount": { "id": "checking-uuid", "name": "Main checking", "type": "bank" },
  "openingBalance": "250.00",
  "openingBalanceDate": "2026-01-01T00:00:00.000Z",
  "outstandingDebt": "310.00",
  "availableCredit": "2690.00"
}
```

`outstandingDebt = opening_balance + signed movements`; `availableCredit = creditLimit - outstandingDebt`.
It may be negative if the card is over its limit.

### Purchases

`GET /api/v1/credit-cards/purchases` returns one entry per card:

```json
{
  "id": "card-account-uuid",
  "name": "Visa",
  "statementDay": 15,
  "dueDay": 5,
  "creditLimit": "3000.00",
  "startDate": "2026-10-16",
  "endDate": "2026-11-15",
  "dueDate": "2026-12-05",
  "totalSpent": "120.00",
  "outstandingDebt": "310.00",
  "availableCredit": "2690.00"
}
```

Billing-cycle dates use the server's local calendar dates and the card's `statementDay`/`dueDay`.

---

## 9. Debit cards

| Method   | Path                                             | Description                      |
| -------- | ------------------------------------------------ | -------------------------------- |
| `POST`   | `/api/v1/debit-cards`                            | Create card for an owned account |
| `GET`    | `/api/v1/debit-cards?accountId=&page=&pageSize=` | List                             |
| `GET`    | `/api/v1/debit-cards/:id`                        | Get one                          |
| `PATCH`  | `/api/v1/debit-cards/:id`                        | Update name/account/last4        |
| `DELETE` | `/api/v1/debit-cards/:id`                        | Delete metadata                  |

Ownership is currently enforced through `accounts.user_id`. The proposed migration
`prisma/sql/001_debit_cards_ownership.sql` adds an explicit `debit_cards.user_id` and a composite
FK; until applied, the application remains safe because every query joins the parent account's
owner.

---

## 10. Reports

All reports read from the ledger, exclude reversed originals, and return money as strings.
`from`/`to` are inclusive. Monthly and yearly periods use UTC boundaries.

| Method | Path                                                                  | Description                                  |
| ------ | --------------------------------------------------------------------- | -------------------------------------------- |
| `GET`  | `/api/v1/reports/monthly?month=&year=&includeTransferFees=`           | Monthly summary + category breakdown         |
| `GET`  | `/api/v1/reports/yearly?year=&includeTransferFees=`                   | Yearly summary + 12-month series + breakdown |
| `GET`  | `/api/v1/reports/range?from=&to=&includeTransferFees=`                | Custom range                                 |
| `GET`  | `/api/v1/reports/expenses-by-category?from=&to=&includeTransferFees=` | Expense breakdown                            |
| `GET`  | `/api/v1/reports/account-balances?asOf=&includeArchived=`             | Current/historical balances                  |
| `GET`  | `/api/v1/reports/credit-cards`                                        | Card debt/available credit                   |
| `GET`  | `/api/v1/reports/cash-flow?year=&includeTransferFees=&sortOrder=`     | Legacy-shaped cash flow                      |

### Summary shape

```json
{
  "from": "2026-11-01T00:00:00.000Z",
  "to": "2026-11-30T23:59:59.999Z",
  "income": "2500.00",
  "expenses": "900.00",
  "transferFees": "5.00",
  "expensesIncludingTransferFees": "905.00",
  "net": "1595.00",
  "adjustments": "0.00",
  "counts": { "income": 2, "expenses": 12, "adjustments": 0 }
}
```

`net` always subtracts transfer fees. `includeTransferFees` controls whether an additional
`"Transfer fees"` line appears in the category breakdown; it does not change the cash-flow result.

### Account balances shape

```json
{
  "asOf": "2026-11-09T00:00:00.000Z",
  "accounts": [
    {
      "id": "account-uuid",
      "name": "Main checking",
      "type": "bank",
      "openingBalance": "1500.00",
      "openingBalanceDate": "2026-01-01T00:00:00.000Z",
      "movementsTotal": "-120.00",
      "balance": "1380.00",
      "outstandingDebt": null,
      "isActive": true
    }
  ],
  "totals": {
    "assets": "1380.00",
    "creditCardDebt": "310.00",
    "netWorth": "1070.00"
  }
}
```

---

## 11. Dashboard compatibility endpoints

These endpoints retain their existing URLs and response field names, but read exclusively from the unified ledger (`transactions` and `account_movements`):

| Method | Path                                                      | Description                                      |
| ------ | --------------------------------------------------------- | ------------------------------------------------ |
| `GET`  | `/api/v1/specials/financial-summary-yearly?year=`         | `{ year, totalEntries, totalExits, netBalance }` |
| `GET`  | `/api/v1/specials/financial-summary-monthly?month=&year=` | Same for a month                                 |
| `GET`  | `/api/v1/specials/cash-flow?year=`                        | Monthly cash-flow series                         |
| `GET`  | `/api/v1/specials/yearly-categories?year=`                | Income/expense category groups                   |
| `GET`  | `/api/v1/specials/recent-transactions?year=`              | Last 15 income/expense items                     |

`totalEntries` maps to income, `totalExits` maps to expenses including transfer fees, and
`netBalance` maps to net. These are compatibility response names only; the legacy
`entries` and `exits` tables and API routes have been retired. All historical financial
records are now represented in the unified ledger.

---

## 12. Other modules

Loans, reminders, savings, and phrases retain their existing APIs:

| Module           | Path                                    |
| ---------------- | --------------------------------------- |
| Loans            | `/api/v1/loans` (+ `/:loanId/payments`) |
| Reminders        | `/api/v1/reminders`                     |
| Savings          | `/api/v1/savings`                       |
| Phrases (public) | `/api/v1/phrases/daily-phrase`          |

They are user-scoped but are not part of the account ledger.

---

## 13. Pagination

List endpoints accept `page` (default `1`) and `pageSize` (default `15`, maximum `100`) and return:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 15,
  "totalPages": 1
}
```

`/accounts/:id/transactions` returns a different shape; see section 4.
