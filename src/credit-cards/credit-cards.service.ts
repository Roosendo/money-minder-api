import { Client } from '@libsql/client'
import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { CreateCreditCardDto, EditCreditCardDto, GetCreditCardsDto } from './credit-cards.dto'

@Injectable()
export class CreditCardsService {
  constructor (
    @Inject('DATABASE_CLIENT') private readonly client: Client,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) {}

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
}
