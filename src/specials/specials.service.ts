import { Inject, Injectable } from '@nestjs/common'
import {
  CashFlowDto,
  CategoriesDto,
  RecentTransactionsDto
} from './specials.dto'
import { Client } from '@libsql/client/.'

@Injectable()
export class SpecialsService {
  constructor (@Inject('DATABASE_CLIENT') private readonly client: Client) { }

  async getCashFlow ({ email, year }: CashFlowDto) {
    const cashFlow = await this.client.execute({
      sql: `SELECT
            month,
            SUM(total_ingresos) AS total_ingresos,
            SUM(total_egresos) AS total_egresos
          FROM
            (
              SELECT
                STRFTIME('%m', DATE) AS month,
                SUM(amount) AS total_ingresos,
                0 AS total_egresos
              FROM
                money_entries
              WHERE
                STRFTIME('%Y', DATE) = ?
              AND
                user_email = ?
              GROUP BY
                STRFTIME('%m', DATE)
              UNION ALL
              SELECT
                STRFTIME('%m', DATE) AS month,
                0 AS total_ingresos,
                SUM(amount) AS total_egresos
              FROM
                money_exits
              WHERE
                STRFTIME('%Y', DATE) = ?
              AND
                user_email = ?
              GROUP BY
                STRFTIME('%m', DATE)
            )
          GROUP BY
            month
          ORDER BY
            month`,
      args: [year, email, year, email]
    })

    return cashFlow.rows
  }

  async getCategories ({ email, year }: CategoriesDto) {
    const categories = await this.client.execute({
      sql: `SELECT category, SUM(amount) AS total
      FROM (
          SELECT category, amount, date
          FROM money_entries
          WHERE user_email = ? AND strftime("%Y", date) = ?
          UNION ALL
          SELECT category, amount AS amount, date
          FROM money_exits
          WHERE user_email = ? AND strftime("%Y", date) = ?
      ) AS combined
      GROUP BY category
      `,
      args: [email, year, email, year]
    })

    return categories.rows
  }

  async getRecentTransactions ({ email, year }: RecentTransactionsDto) {
    const transactions = await this.client.execute({
      sql: `SELECT
            date,
            category,
            amount
          FROM
            (
              SELECT
                date,
                category,
                amount
              FROM
                money_entries
              WHERE
                user_email = ?
                AND STRFTIME('%Y', date) = ?
              ORDER BY
                entry_id DESC
              LIMIT
                4
            ) AS latest_entries
          UNION ALL
          SELECT
            date,
            category,
            amount
          FROM
            (
              SELECT
                category,
                amount,
                date
              FROM
                money_exits
              WHERE
                user_email = ?
                AND STRFTIME('%Y', date) = ?
              ORDER BY
                exit_id DESC
              LIMIT
                4
            ) AS latest_exits
          ORDER BY
            date DESC
          `,
      args: [email, year, email, year]
    })

    return transactions.rows
  }
}
