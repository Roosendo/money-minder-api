import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import {
  CreateCreditCardDto,
  CreditCardPaymentDto,
  GetCreditCardsDto,
  UpdateCreditCardDto,
} from "./credit-cards.dto";
import { CreditCardsService } from "./credit-cards.service";

@ApiTags("credit-cards")
@ApiBearerAuth()
@Controller("credit-cards")
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Post()
  @ApiOperation({ summary: "Create a credit card account with its metadata" })
  async create(@CurrentUser() user: users, @Body() dto: CreateCreditCardDto) {
    return this.creditCardsService.create(user.id, dto);
  }

  @Get()
  async list(@CurrentUser() user: users, @Query() dto: GetCreditCardsDto) {
    return this.creditCardsService.list(user.id, dto);
  }

  @Get("purchases")
  @ApiOperation({ summary: "Current billing cycle purchases for every card" })
  async getAllPurchases(@CurrentUser() user: users) {
    return this.creditCardsService.getPurchasesRange(user.id);
  }

  @Get(":accountId")
  async getById(@CurrentUser() user: users, @Param("accountId") accountId: string) {
    return this.creditCardsService.getById(user.id, accountId);
  }

  @Get(":accountId/summary")
  @ApiOperation({ summary: "Credit limit, outstanding debt and available credit" })
  async getSummary(@CurrentUser() user: users, @Param("accountId") accountId: string) {
    return this.creditCardsService.getById(user.id, accountId);
  }

  @Get(":accountId/purchases")
  async getPurchases(@CurrentUser() user: users, @Param("accountId") accountId: string) {
    return this.creditCardsService.getPurchasesRange(user.id, accountId);
  }

  @Patch(":accountId")
  async update(
    @CurrentUser() user: users,
    @Param("accountId") accountId: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.creditCardsService.update(user.id, accountId, dto);
  }

  @Post(":accountId/payments")
  @ApiOperation({ summary: "Pay a credit card from one of the user's asset accounts" })
  async pay(
    @CurrentUser() user: users,
    @Param("accountId") accountId: string,
    @Body() dto: CreditCardPaymentDto,
  ) {
    return this.creditCardsService.pay(user.id, accountId, dto);
  }

  @Delete(":accountId")
  @ApiOperation({ summary: "Archive a credit card; hard delete only with ?hard=true" })
  async remove(
    @CurrentUser() user: users,
    @Param("accountId") accountId: string,
    @Query("hard", new DefaultValuePipe(false), ParseBoolPipe) hard: boolean,
  ) {
    return this.creditCardsService.remove(user.id, accountId, hard);
  }
}
