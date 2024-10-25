import { Client } from '@libsql/client'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { CreateCreditCardDto, EditCreditCardDto, GetCreditCardsDto, PurchaseRange } from './credit-cards.dto'

@Injectable()
export class CreditCardsService {
  constructor(
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) { }

  async newCreditCard({ email, name, cutOffDate, paymentDueDate }: CreateCreditCardDto) {
    await this.client.execute({
      sql: 'INSERT INTO credit_cards (user_email, name, cut_off_date, payment_due_date) VALUES (?, ?, ?, ?)',
      args: [email, name, cutOffDate, paymentDueDate]
    })

    await this.cacheManager.del(`credit_cards_${email}`)
  }

  @CacheKey('credit_cards')
  @CacheTTL(60 * 1000)
  async getCreditCards({ email }: GetCreditCardsDto) {
    const cacheKey = `credit_cards_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const creditCards = await this.client.execute({
      sql: 'SELECT credit_card_id, name, cut_off_date, payment_due_date FROM credit_cards WHERE user_email = ?',
      args: [email]
    })

    await this.cacheManager.set(cacheKey, creditCards.rows, { ttl: 60 * 1000 })
    return creditCards.rows
  }

  async editCreditCard({ creditCardId, userEmail, name, cutOffDate, paymentDueDate }: EditCreditCardDto) {
    await this.client.execute({
      sql: 'UPDATE credit_cards SET name = ?, cut_off_date = ?, payment_due_date = ? WHERE credit_card_id = ? AND user_email = ?',
      args: [name, cutOffDate, paymentDueDate, creditCardId, userEmail]
    })

    await this.cacheManager.del(`credit_cards_${userEmail}`)
  }

  async deleteCreditCard({ creditCardId, userEmail }: EditCreditCardDto) {
    await this.client.execute({
      sql: 'DELETE FROM credit_cards WHERE credit_card_id = ? AND user_email = ?',
      args: [creditCardId, userEmail]
    })

    await this.cacheManager.del(`credit_cards_${userEmail}`)
  }

  async getPurchasesRange({ email }: PurchaseRange) {
    const purchases = await this.client.execute({
      sql: `
        WITH CutOffDates AS (
          SELECT 
            credit_card_id,
            user_email,
            cut_off_date,
            DATE(
              CASE 
                WHEN strftime('%d', 'now') > cut_off_date THEN
                  strftime('%Y-%m-', 'now') || cut_off_date
                ELSE
                  strftime('%Y-%m-', 'now', '-1 month') || cut_off_date
              END
            ) AS end_cut_off_date,
            DATE(
              CASE 
                WHEN strftime('%d', 'now') > cut_off_date THEN
                  strftime('%Y-%m-', 'now', '-1 month') || (cut_off_date + 1)
                ELSE
                  strftime('%Y-%m-', 'now', '-2 months') || (cut_off_date + 1)
              END
            ) AS start_cut_off_date
          FROM 
            credit_cards
          WHERE 
            user_email = ?
        )
        SELECT 
          cc.credit_card_id,
          cc.name,
          cc.cut_off_date,
          cod.start_cut_off_date,
          cod.end_cut_off_date,
          me.exit_id,
          me.amount,
          me.description,
          me.date,
          IFNULL(SUM(me.amount) OVER (PARTITION BY cc.credit_card_id), 0) AS total_amount
        FROM 
          credit_cards cc
        JOIN 
          CutOffDates cod ON cc.credit_card_id = cod.credit_card_id
        LEFT JOIN 
          money_exits me 
        ON 
          cc.credit_card_id = me.credit_card_id
        AND 
          me.date BETWEEN cod.start_cut_off_date AND cod.end_cut_off_date
        WHERE 
          cc.user_email = ?
      `,
      args: [email, email]
    })

    return purchases.rows
  }
}
