import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { CreateCreditCardDto, EditCreditCardDto } from "./credit-cards.dto";
import { CreditCardsService } from "./credit-cards.service";

@Controller("credit-cards")
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Post()
  async newCreditCard(@CurrentUser() user: users, @Body() dto: CreateCreditCardDto) {
    return this.creditCardsService.newCreditCard(user.id, dto);
  }

  @Get()
  async getCreditCards(@CurrentUser() user: users) {
    return this.creditCardsService.getCreditCards(user.id);
  }

  @Get("purchases")
  async getAllPurchases(@CurrentUser() user: users) {
    return this.creditCardsService.getPurchasesRange(user.id);
  }

  @Get(":creditCardId")
  async getCreditCard(@CurrentUser() user: users, @Param("creditCardId") creditCardId: string) {
    return this.creditCardsService.getCreditCardById(user.id, creditCardId);
  }

  @Patch(":creditCardId")
  async editCreditCard(
    @CurrentUser() user: users,
    @Param("creditCardId") creditCardId: string,
    @Body() dto: EditCreditCardDto,
  ) {
    return this.creditCardsService.editCreditCard(user.id, creditCardId, dto);
  }

  @Delete(":creditCardId")
  async deleteCreditCard(@CurrentUser() user: users, @Param("creditCardId") creditCardId: string) {
    return this.creditCardsService.deleteCreditCard(user.id, creditCardId);
  }

  @Get(":creditCardId/purchases")
  async getCardPurchases(@CurrentUser() user: users, @Param("creditCardId") creditCardId: string) {
    return this.creditCardsService.getPurchasesRange(user.id, creditCardId);
  }
}
