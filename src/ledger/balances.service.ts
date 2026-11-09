import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { OwnershipService } from "./ownership.service";

export interface AccountBalanceRow {
  id: string;
  name: string;
  type: string;
  opening_balance: string;
  opening_balance_date: Date;
  is_active: boolean;
  movements_total: string;
  balance: string;
}

export interface RunningBalanceRow {
  transaction_id: string;
  type: string;
  occurred_at: Date;
  transaction_amount: string;
  description: string | null;
  movement_id: string;
  movement_amount: string;
  running_balance: string;
}

export interface DailyBalanceRow {
  day: string;
  balance: string;
}

export interface AccountHistoryResult {
  accountId: string;
  openingBalance: string;
  openingBalanceDate: Date;
  items: RunningBalanceRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class BalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getBalance(userId: string, accountId: string, asOf: Date = new Date()) {
    const rows = await this.prisma.$queryRaw<AccountBalanceRow[]>(Prisma.sql`
      SELECT
        a.id,
        a.name,
        a.type::text AS type,
        a.opening_balance::text AS opening_balance,
        a.opening_balance_date,
        a.is_active,
        COALESCE(
          SUM(m.amount) FILTER (
            WHERE t.occurred_at >= a.opening_balance_date
              AND t.occurred_at <= ${asOf}::timestamptz
          ),
          0
        )::numeric(14, 2)::text AS movements_total,
        (
          a.opening_balance + COALESCE(
            SUM(m.amount) FILTER (
              WHERE t.occurred_at >= a.opening_balance_date
                AND t.occurred_at <= ${asOf}::timestamptz
            ),
            0
          )
        )::numeric(14, 2)::text AS balance
      FROM public.accounts a
      LEFT JOIN public.account_movements m
        ON m.account_id = a.id AND m.user_id = a.user_id
      LEFT JOIN public.transactions t
        ON t.id = m.transaction_id AND t.user_id = a.user_id
      WHERE a.id = ${accountId}::uuid AND a.user_id = ${userId}::uuid
      GROUP BY a.id
    `);

    if (!rows.length) {
      throw new NotFoundException("Account not found");
    }
    return rows[0];
  }

  async getBalances(userId: string, asOf: Date = new Date(), includeArchived = false) {
    return this.prisma.$queryRaw<AccountBalanceRow[]>(Prisma.sql`
      SELECT
        a.id,
        a.name,
        a.type::text AS type,
        a.opening_balance::text AS opening_balance,
        a.opening_balance_date,
        a.is_active,
        COALESCE(
          SUM(m.amount) FILTER (
            WHERE t.occurred_at >= a.opening_balance_date
              AND t.occurred_at <= ${asOf}::timestamptz
          ),
          0
        )::numeric(14, 2)::text AS movements_total,
        (
          a.opening_balance + COALESCE(
            SUM(m.amount) FILTER (
              WHERE t.occurred_at >= a.opening_balance_date
                AND t.occurred_at <= ${asOf}::timestamptz
            ),
            0
          )
        )::numeric(14, 2)::text AS balance
      FROM public.accounts a
      LEFT JOIN public.account_movements m
        ON m.account_id = a.id AND m.user_id = a.user_id
      LEFT JOIN public.transactions t
        ON t.id = m.transaction_id AND t.user_id = a.user_id
      WHERE a.user_id = ${userId}::uuid
        AND (${includeArchived}::boolean OR a.is_active)
      GROUP BY a.id
      ORDER BY a.name ASC
    `);
  }

  async getHistory(
    userId: string,
    accountId: string,
    from: Date,
    to: Date,
    page: number,
    pageSize: number,
  ): Promise<AccountHistoryResult> {
    const account = await this.ownership.requireAccount(userId, accountId);

    const rows = await this.prisma.$queryRaw<RunningBalanceRow[]>(Prisma.sql`
      WITH acct AS (
        SELECT id, user_id, opening_balance, opening_balance_date
        FROM public.accounts
        WHERE id = ${accountId}::uuid AND user_id = ${userId}::uuid
      ),
      ordered AS (
        SELECT
          t.id AS transaction_id,
          t.type::text AS type,
          t.occurred_at,
          t.created_at AS transaction_created_at,
          t.amount::text AS transaction_amount,
          t.description,
          m.id AS movement_id,
          m.amount::text AS movement_amount,
          (
            a.opening_balance + SUM(m.amount) OVER (
              ORDER BY t.occurred_at, t.created_at, t.id, m.id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
          ) AS running_balance
        FROM acct a
        JOIN public.account_movements m
          ON m.account_id = a.id AND m.user_id = a.user_id
        JOIN public.transactions t
          ON t.id = m.transaction_id AND t.user_id = a.user_id
        WHERE t.occurred_at >= a.opening_balance_date
          AND t.occurred_at <= ${to}::timestamptz
      )
      SELECT
        transaction_id,
        type,
        occurred_at,
        transaction_amount,
        description,
        movement_id,
        movement_amount,
        running_balance::numeric(14, 2)::text AS running_balance
      FROM ordered
      WHERE occurred_at >= ${from}::timestamptz
      ORDER BY occurred_at ASC, transaction_created_at ASC, transaction_id ASC, movement_id ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    const countRows = await this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM public.accounts a
      JOIN public.account_movements m
        ON m.account_id = a.id AND m.user_id = a.user_id
      JOIN public.transactions t
        ON t.id = m.transaction_id AND t.user_id = a.user_id
      WHERE a.id = ${accountId}::uuid
        AND a.user_id = ${userId}::uuid
        AND t.occurred_at >= GREATEST(a.opening_balance_date, ${from}::timestamptz)
        AND t.occurred_at <= ${to}::timestamptz
    `);

    const total = countRows[0]?.count ?? 0;

    return {
      accountId: account.id,
      openingBalance: account.opening_balance.toFixed(2),
      openingBalanceDate: account.opening_balance_date,
      items: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async getDailyBalances(
    userId: string,
    accountId: string,
    fromDate: string,
    toDate: string,
  ): Promise<DailyBalanceRow[]> {
    await this.ownership.requireAccount(userId, accountId);

    return this.prisma.$queryRaw<DailyBalanceRow[]>(Prisma.sql`
      WITH acct AS (
        SELECT id, user_id, opening_balance, opening_balance_date
        FROM public.accounts
        WHERE id = ${accountId}::uuid AND user_id = ${userId}::uuid
      ),
      opening AS (
        SELECT COALESCE(SUM(m.amount), 0) AS delta
        FROM acct a
        JOIN public.account_movements m
          ON m.account_id = a.id AND m.user_id = a.user_id
        JOIN public.transactions t
          ON t.id = m.transaction_id AND t.user_id = a.user_id
        WHERE t.occurred_at >= a.opening_balance_date
          AND t.occurred_at < ${fromDate}::date::timestamptz
      ),
      daily AS (
        SELECT
          (t.occurred_at AT TIME ZONE 'UTC')::date AS day,
          SUM(m.amount) AS delta
        FROM acct a
        JOIN public.account_movements m
          ON m.account_id = a.id AND m.user_id = a.user_id
        JOIN public.transactions t
          ON t.id = m.transaction_id AND t.user_id = a.user_id
        WHERE t.occurred_at >= GREATEST(a.opening_balance_date, ${fromDate}::date::timestamptz)
          AND t.occurred_at < (${toDate}::date + INTERVAL '1 day')
        GROUP BY 1
      ),
      series AS (
        SELECT generate_series(${fromDate}::date, ${toDate}::date, INTERVAL '1 day')::date AS day
      )
      SELECT
        s.day::text AS day,
        (
          (SELECT delta FROM opening) +
          COALESCE(SUM(COALESCE(d.delta, 0)) OVER (ORDER BY s.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0)
        )::numeric(14, 2)::text AS balance
      FROM series s
      LEFT JOIN daily d ON d.day = s.day
      ORDER BY s.day ASC
    `);
  }
}
