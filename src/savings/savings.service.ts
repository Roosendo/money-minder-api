import { Inject, Injectable } from '@nestjs/common'
import {
  CreateSavingDto,
  GetSavingsDto,
  DeleteSavingDto,
  UpdateSavingDto
} from './savings.dto'
import { Client } from '@libsql/client/.'

@Injectable()
export class SavingsService {
  constructor (@Inject('DATABASE_CLIENT') private readonly client: Client) { }

  async newSaving (
    { email, name, targetAmount, currentAmount, startDate, endDate }: CreateSavingDto
  ) {
    await this.client.execute({
      sql: 'INSERT INTO savings_goals (user_email, name, target_amount, current_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      args: [email, name, targetAmount, currentAmount, startDate, endDate]
    })
  }

  async getSavings ({ email }: GetSavingsDto) {
    const savings = await this.client.execute({
      sql: 'SELECT id, name, target_amount, current_amount, end_date FROM savings_goals WHERE user_email = ?',
      args: [email]
    })

    return savings.rows
  }

  async deleteSaving (
    { email, id }: DeleteSavingDto
  ) {
    await this.client.execute({
      sql: 'DELETE FROM savings_goals WHERE user_email = ? AND id = ?',
      args: [email, id]
    })
  }

  async updateSaving (
    { email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }: UpdateSavingDto
  ) {
    await this.client.execute({
      sql: 'UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, end_date = ? WHERE user_email = ? AND id = ?',
      args: [newSavingName, newTarget, newCurrentAmount, newEndDate, email, id]
    })
  }
}
