import { CACHE_MANAGER, CacheKey, CacheStore, CacheTTL } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { CreateCreditCardDto, EditCreditCardDto, GetCreditCardsDto, PurchaseRange } from './credit-cards.dto'
import { PrismaService } from '@/prisma.service'

@Injectable()
export class CreditCardsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore
  ) { }

  async newCreditCard({ email, name, cutOffDate, paymentDueDate }: CreateCreditCardDto) {
    await this.prisma.credit_cards.create({
      data: {
        user_email: email,
        name,
        cut_off_date: +cutOffDate,
        payment_due_date: +paymentDueDate
      }
    })

    await this.cacheManager.del(`credit_cards_${email}`)
  }

  @CacheKey('credit_cards')
  @CacheTTL(60 * 1000)
  async getCreditCards({ email }: GetCreditCardsDto) {
    const cacheKey = `credit_cards_${email}`
    const cacheData = await this.cacheManager.get(cacheKey)
    if (cacheData) return cacheData

    const creditCards = await this.prisma.credit_cards.findMany({
      where: { user_email: email },
      select: { credit_card_id: true, name: true, cut_off_date: true, payment_due_date: true }
    })

    await this.cacheManager.set(cacheKey, creditCards, { ttl: 60 * 1000 })
    return creditCards
  }

  async editCreditCard({ creditCardId, userEmail, name, cutOffDate, paymentDueDate }: EditCreditCardDto) {
    await this.prisma.credit_cards.update({
      where: { credit_card_id: +creditCardId, user_email: userEmail },
      data: { name, cut_off_date: +cutOffDate, payment_due_date: +paymentDueDate }
    })

    await this.cacheManager.del(`credit_cards_${userEmail}`)
  }

  async deleteCreditCard({ creditCardId, userEmail }: EditCreditCardDto) {
    await this.prisma.credit_cards.delete({
      where: { credit_card_id: +creditCardId, user_email: userEmail }
    })

    await this.cacheManager.del(`credit_cards_${userEmail}`)
  }

  async getPurchasesRange({ email }: PurchaseRange) {
    // 1. Primero, obtenemos las tarjetas y calculamos las fechas de corte
    const now = new Date()
    const currentDay = now.getDate()

    const creditCards = await this.prisma.credit_cards.findMany({
      where: {
        user_email: email
      },
      select: {
        credit_card_id: true,
        name: true,
        cut_off_date: true,
      }
    })

    // 2. Calculamos las fechas de corte para cada tarjeta
    const cardsWithDates = creditCards.map(card => {
      const cutOffDate = card.cut_off_date

      let endCutOffDate: Date
      let startCutOffDate: Date

      if (currentDay > cutOffDate) {
        // Fecha actual
        endCutOffDate = new Date(now.getFullYear(), now.getMonth(), cutOffDate)
        // Mes anterior
        startCutOffDate = new Date(now.getFullYear(), now.getMonth() - 1, cutOffDate + 1)
      } else {
        // Mes anterior
        endCutOffDate = new Date(now.getFullYear(), now.getMonth() - 1, cutOffDate)
        // Dos meses atrás
        startCutOffDate = new Date(now.getFullYear(), now.getMonth() - 2, cutOffDate + 1)
      }

      return {
        ...card,
        start_cut_off_date: startCutOffDate,
        end_cut_off_date: endCutOffDate
      }
    })

    // 3. Obtenemos los movimientos y calculamos totales
    const result = await Promise.all(cardsWithDates.map(async card => {
      const exits = await this.prisma.money_exits.findMany({
        where: {
          credit_card_id: card.credit_card_id,
          date: {
            gte: card.start_cut_off_date,
            lte: card.end_cut_off_date
          }
        },
        select: {
          exit_id: true,
          amount: true,
          description: true,
          date: true
        }
      })

      const total_amount = exits.reduce((sum, exit) => sum + (+exit.amount || 0), 0)

      return {
        ...card,
        exits,
        total_amount
      }
    }))

    return result
  }
}
