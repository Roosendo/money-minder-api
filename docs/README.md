# Documentation

| Document                                             | Audience                    | Contents                                                                          |
| ---------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| [BACKEND_API.md](./BACKEND_API.md)                   | Backend/frontend developers | Auth, money format, ledger rules, every ledger endpoint, response shapes          |
| [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) | Frontend developers         | Breaking changes, client types, auth, flows, error handling                       |
| [AUDIT.md](./AUDIT.md)                               | Maintainers/reviewers       | Starting state, ownership/security audit, semantics, test results, residual risks |
| [MIGRATION.md](./MIGRATION.md)                       | Operators/maintainers       | Non-applied SQL plan, legacy import, reconciliation, rollback, cutover            |

Related files:

- `prisma/sql/` — proposal-only migration and reconciliation SQL
- `scripts/legacy-audit.cjs` — read-only ownership/migration audit
- `test/app.e2e-spec.ts` — current smoke suite; set `TEST_TOKEN` for authenticated checks

Start with `AUDIT.md` for the decisions and risks, then use `MIGRATION.md` before touching a
database.
