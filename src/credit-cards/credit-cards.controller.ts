import { AllExceptionsFilter } from '@/middlewares/errors'
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseFilters } from '@nestjs/common'
import { CreditCardsService } from './credit-cards.service'
import { UsersService } from '@/users/users.service'
import { CreateUserDto } from '@/users/users.dto'
import { ApiPurchases, CreateCreditCardDto, DeleteCreditCardDto, EditCreditCardDto, GetCreditCardsDto } from './credit-cards.dto'
import { getPurchaseRange } from './credit-cards.utils'

@Controller('api/credit-cards')
@UseFilters(AllExceptionsFilter)
export class CreditCardsController {
  constructor(
    private readonly creditCardsService: CreditCardsService,
    private readonly usersService: UsersService
  ) {}

  @Post('')
  async newCreditCard(@Body() createCreditCardDto: CreateCreditCardDto) {
    const createUserDto: CreateUserDto = {
      email: createCreditCardDto.email,
      fullName: createCreditCardDto.fullName
    }
    await this.usersService.createUser(createUserDto)
    return this.creditCardsService.newCreditCard(createCreditCardDto)
  }

  @Get('')
  async getCreditCards(@Query() getCreditCardsDto: GetCreditCardsDto) {
    const creditCards = await this.creditCardsService.getCreditCards(getCreditCardsDto)
    return creditCards
  }

  @Put('/:creditCardId')
  async editCreditCard(@Body() editCreditCardDto: EditCreditCardDto, @Param('creditCardId') creditCardId: string) {
    return this.creditCardsService.editCreditCard({ ...editCreditCardDto, creditCardId })
  }

  @Delete('/:creditCardId')
  async deleteCreditCard(@Body() deleteCreditCardDto: DeleteCreditCardDto, @Param('creditCardId') creditCardId: string) {
    return this.creditCardsService.deleteCreditCard({ ...deleteCreditCardDto, creditCardId })
  }

  @Get('/:creditCardId/purchases')
  async getPurchases(@Param('creditCardId') creditCardId: string) {
    const dates = this.creditCardsService.getDates({ creditCardId: +creditCardId })
    if (!(await dates).rows.length) return (await dates).rows
    const { cut_off_date } = (await dates).rows[0] as unknown as ApiPurchases
    const [ cutOffDate, paymentDueDate ] = getPurchaseRange(+cut_off_date)
    return this.creditCardsService.getPurchasesRange({ creditCardId: +creditCardId, cutOffDate, paymentDueDate })
  }
}
