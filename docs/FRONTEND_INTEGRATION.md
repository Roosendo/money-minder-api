# Frontend Integration Guide

This document describes how the SPA should integrate with the current ledger API. It also lists
the breaking changes from the previous client.

No frontend code was changed in this work. These are integration instructions.

---

## 1. Breaking changes checklist

| Area                 | Before                                 | Now                                                |
| -------------------- | -------------------------------------- | -------------------------------------------------- |
| Money in JSON        | Numbers (`1250`)                       | Strings (`"1250.00"`)                              |
| BigInt values        | Numbers (unsafe)                       | Strings                                            |
| Credit cards         | Standalone records with `creditCardId` | Accounts with `type = "credit_card"` plus metadata |
| Credit card routes   | `{id}` / `creditCardId`                | `:accountId` (the account UUID)                    |
| Transactions         | Legacy entries/exits                   | `/transactions` income/expense/adjustment          |
| Transfers            | May have counted as income/expense     | `type = "transfer"`, never income/expense          |
| Specials/dashboard   | Read legacy entries/exits              | Read the unified ledger                            |
| Deletion             | Hard delete                            | Reversal by default; `?hard=true` is opt-in        |
| Legacy entries/exits | Main write path                        | Deprecated; still writes legacy tables only        |

### Money is a string

Update every TypeScript type and formatter:

```ts
type Money = string; // always two decimals, e.g. "1250.00"

type Account = {
  id: string;
  name: string;
  type: "cash" | "bank" | "savings" | "credit_card";
  openingBalance: Money;
  openingBalanceDate: string;
  isActive: boolean;
  movementsTotal: Money;
  balance: Money;
  outstandingDebt: Money | null;
};
```

Do not use `parseFloat` or `Number` for arithmetic. If the UI needs to calculate, use a decimal
library:

```ts
import Decimal from "decimal.js";

const total = new Decimal(a.balance).plus(b.balance).toFixed(2);
```

For display only, pass the string directly to the formatter:

```ts
new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
  Number(amount), // display only; never feed this back into ledger math
);
```

If you must convert to number for a chart, keep the original string for all writes and totals.

---

## 2. Authentication

### Browser session (recommended)

1. Redirect the user to:

```
GET /api/v1/auth/google?callbackURL=<encoded frontend callback>
GET /api/v1/auth/github?callbackURL=<encoded frontend callback>
```

2. The API sets a Better Auth cookie and redirects back to `callbackURL`.
3. Send cookies on every API request:

```ts
await fetch(`${API_URL}/api/v1/accounts`, {
  credentials: "include",
  headers: { Accept: "application/json" },
});
```

CORS is enabled with credentials. The frontend origin must be in `CORS_ORIGINS`,
`FRONTEND_URL`, or the built-in allow-list.

### Bearer token

If the client stores a Better Auth bearer token:

```ts
headers: {
  Authorization: `Bearer ${token}`,
}
```

The token is hashed and matched against `sessions.token_hash` server-side. Never send a
`userId`; the server derives the user from the session.

### Current user

```http
GET /api/v1/auth/me
```

```json
{
  "id": "user-uuid",
  "name": "Ada",
  "email": "ada@example.com",
  "avatarUrl": null
}
```

---

## 3. Suggested client modules

```ts
const API = `${import.meta.env.VITE_API_URL}/api/v1`;

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? response.statusText, body);
  }

  return body as T;
}

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown,
  ) {
    super(message);
  }
}
```

Handle `401` by redirecting to login. Treat `404` on a resource as "not found or not yours" and
do not retry.

---

## 4. Loading the dashboard

Recommended order:

```ts
const [accounts, categories, summary, cards] = await Promise.all([
  api<Account[]>("/accounts"),
  api<Category[]>("/categories"),
  api<MonthlyReport>(`/reports/monthly?year=${year}&month=${month}`),
  api<CreditCard[]>("/credit-cards"),
]);
```

Balance semantics:

```ts
// Asset accounts: balance is money available.
// Credit cards: balance and outstandingDebt are debt (positive = owed).
const moneyAvailable = accounts
  .filter((account) => account.type !== "credit_card")
  .reduce((sum, account) => sum.plus(account.balance), new Decimal(0));

const debt = accounts
  .filter((account) => account.type === "credit_card")
  .reduce((sum, account) => sum.plus(account.balance), new Decimal(0));
```

`/reports/account-balances` already returns `totals.assets`, `totals.creditCardDebt`, and
`totals.netWorth`; prefer it when you need net worth.

---

## 5. Creating and editing transactions

```ts
type CreateTransaction = {
  type: "income" | "expense" | "adjustment";
  amount: Money;
  accountId: string;
  categoryId?: string;
  description?: string;
  occurredAt?: string;
  direction?: "increase" | "decrease"; // required for adjustment
};

await api<Transaction>("/transactions", {
  method: "POST",
  body: JSON.stringify({
    type: "expense",
    amount: "42.50",
    accountId: checkingId,
    categoryId: groceriesId,
    description: "Groceries",
    occurredAt: new Date().toISOString(),
  }),
});
```

Rules the UI should enforce before submitting:

- `amount` must be greater than `"0.00"` and have at most two decimals.
- `income` and `expense` require a matching category type if a category is supplied.
- `adjustment` requires `direction` and must not send a category.
- Archived accounts are rejected; hide them or disable submission.
- Credit card purchases are normal `expense` transactions on the credit-card account. The server
  converts them to positive debt movements; do not invert the amount in the UI.

### Editing

`PATCH /transactions/:id` accepts `amount`, `accountId`, `categoryId`, `description`,
`occurredAt`, and `direction`. The server recalculates the movement atomically. Reversed
transactions cannot be edited.

### Deleting/reversing

```ts
// Safe default: creates a compensating reversal.
await api(`/transactions/${id}`, { method: "DELETE" });

// Explicit reversal (optional occurredAt):
await api(`/transactions/${id}/reverse`, {
  method: "POST",
  body: JSON.stringify({ occurredAt: new Date().toISOString() }),
});
```

Do not call `DELETE /transactions/:id?hard=true` from normal UI flows. Reserve it for an
"administrator / fix a mistake" action with a confirmation dialog.

---

## 6. Transfers and credit card payments

### Transfer

```ts
await api<Transaction>("/transfers", {
  method: "POST",
  body: JSON.stringify({
    fromAccountId: checkingId,
    toAccountId: savingsId,
    amount: "20.00",
    fee: "1.00",
    description: "Savings top-up",
  }),
});
```

Show the fee separately in the confirmation:

> Source account: **−$21.00** (transfer $20.00 + fee $1.00)
> Destination: **+$20.00**

### Credit card payment

```ts
await api<Transaction>(`/credit-cards/${cardAccountId}/payments`, {
  method: "POST",
  body: JSON.stringify({
    fromAccountId: checkingId,
    amount: "100.00",
    fee: "0.00",
  }),
});
```

A credit card cannot be the source account of a transfer or a payment. The payment account must
be an active cash/bank/savings account owned by the user.

### Fee reporting

- `reports.summary.transferFees` is always populated.
- `reports.summary.net` always subtracts fees.
- `includeTransferFees=true` adds a `"Transfer fees"` line to `expensesByCategory`.
- Fees never appear as `income`/`expense` transactions.

---

## 7. Credit cards

Old clients that used a standalone `creditCardId` must switch to the card's **account id**.

```ts
type CreditCard = {
  id: string; // account UUID
  accountId: string;
  name: string;
  type: "credit_card";
  isActive: boolean;
  last4: string | null;
  creditLimit: Money;
  statementDay: number;
  dueDay: number;
  paymentAccountId: string | null;
  paymentAccount: { id: string; name: string; type: string } | null;
  openingBalance: Money;
  openingBalanceDate: string;
  outstandingDebt: Money;
  availableCredit: Money;
};
```

Create:

```ts
await api<CreditCard>("/credit-cards", {
  method: "POST",
  body: JSON.stringify({
    name: "Visa",
    creditLimit: "3000.00",
    statementDay: 15,
    dueDay: 5,
    last4: "4242",
    openingBalance: "250.00",
    paymentAccountId: checkingId,
  }),
});
```

`openingBalance` is opening debt, not available credit. It must be non-negative.

Purchases for the current billing cycle:

```ts
const cycles = await api<CardCycle[]>("/credit-cards/purchases");
```

Use `startDate`, `endDate`, and `dueDate` (ISO date-only strings) for labels. `totalSpent` is the
sum of non-reversed expenses in that cycle.

---

## 8. Accounts and history

```ts
// Current balances (default excludes archived accounts)
const accounts = await api<Account[]>("/accounts?includeArchived=false");

// Point-in-time balance
const account = await api<Account>(`/accounts/${id}/balance?asOf=2026-10-31T23:59:59.999Z`);

// Daily series for a chart
const daily = await api<{ day: string; balance: Money }[]>(
  `/accounts/${id}/balances?from=2026-11-01&to=2026-11-30`,
);

// Running-balance history (raw SQL field names)
const history = await api<AccountHistory>(
  `/accounts/${id}/transactions?from=2026-11-01&to=2026-11-30&page=1&pageSize=50`,
);
```

Important: the history endpoint returns `transaction_id`, `occurred_at`, `movement_amount`, and
`running_balance` in snake_case. Do not assume the camelCase transaction shape here.

Archive accounts instead of deleting them. Hard delete fails when the account has ledger history,
cards, or transfers.

---

## 9. Categories

```ts
const categories = await api<Category[]>("/categories?type=expense");

// Category
{
  "id": "cat-uuid",
  "name": "Food",
  "type": "expense",
  "userId": null // null = global
}
```

Only send a category id that came from this endpoint. The server rejects another user's private
category with `404`.

---

## 10. Legacy route migration

If the frontend still calls:

- `/entries` or `/exits` — migrate to `/transactions`.
- `/specials/*` — keep the routes if convenient, but expect ledger-only numbers. Legacy rows are
  not included until the migration SQL is applied.
- Any credit-card route containing `creditCardId` — replace it with the card's `accountId`.

Do not use legacy entries/exits for new features. They write different tables and will not update
ledger balances.

---

## 11. Error and validation UX

- `400`: show the server message next to the form. Common causes: archived account, category type
  mismatch, adjustment without direction, credit card used as transfer source, negative fee.
- `401`: session expired; redirect to login.
- `404`: resource missing or not owned. Do not reveal which.
- `409`: duplicate/conflict, including a concurrent reversal.
- `500`: show a generic error and log the response body.

Validation messages may be a string or an array of strings from NestJS/class-validator. Normalize
before rendering:

```ts
const message = Array.isArray(error.body?.message) ? error.body.message.join(", ") : error.message;
```

---

## 12. Recommended UI states

- Show `availableCredit` as a separate value from `outstandingDebt`.
- Label credit card `balance` as "Owed", not "Available".
- For transfers, show the fee in the source deduction and keep the destination amount separate.
- For reversed transactions, display a "Reversed" badge and disable edit/delete actions.
- For adjusted transactions, show the direction (`increase`/`decrease`) rather than a signed
  transaction amount.
- Treat all money as strings from the API and only convert at the final display step.
