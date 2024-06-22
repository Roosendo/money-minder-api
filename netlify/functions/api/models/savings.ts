import { client } from '../config/tursoClient.js'
import type { newGoal, singleGoal, updatedGoal } from '../types'

export default class Savings {
  static async newSaving (
    { email, name, targetAmount, currentAmount, startDate, endDate }: newGoal
  ) {
    await client.execute({
      sql: 'INSERT INTO savings_goals (user_email, name, target_amount, current_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      args: [email, name, targetAmount, currentAmount, startDate, endDate]
    })
  }

  static async getSavings (
    { email }: { email: string }
  ) {
    const savings = await client.execute({
      sql: 'SELECT id, name, target_amount, current_amount, end_date FROM savings_goals WHERE user_email = ?',
      args: [email]
    })

    return savings.rows
  }

  static async deleteSaving (
    { email, id }: singleGoal
  ) {
    await client.execute({
      sql: 'DELETE FROM savings_goals WHERE user_email = ? AND id = ?',
      args: [email, id]
    })
  }

  static async updateSaving (
    { email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }: updatedGoal
  ) {
    await client.execute({
      sql: 'UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, end_date = ? WHERE user_email = ? AND id = ?',
      args: [newSavingName, newTarget, newCurrentAmount, newEndDate, email, id]
    })
  }
}
