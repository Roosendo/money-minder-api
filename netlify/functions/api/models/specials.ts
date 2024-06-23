import { client } from '../config/tursoClient.js'

export default class Special {
  static async getCashFlow (
    { email, year }: { email: string, year: string }
  ) {
    const cashFlow = await client.execute({
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

  static async getYearlyCategories (
    { email, year }: { email: string, year: string }
  ) {
    const categories = await client.execute({
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
}
