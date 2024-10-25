import { AllExceptionsFilter } from '@/middlewares/errors'
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseFilters } from '@nestjs/common'
import { CreditCardsService } from './credit-cards.service'
import { UsersService } from '@/users/users.service'
import { CreateUserDto } from '@/users/users.dto'
import { CreateCreditCardDto, DeleteCreditCardDto, EditCreditCardDto, GetCreditCardsDto } from './credit-cards.dto'

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

  @Get('/purchases')
  async getPurchases(@Query('email') email: string) {
    return this.creditCardsService.getPurchasesRange({ email })
  }
}
