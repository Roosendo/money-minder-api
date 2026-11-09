import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { CreateDebitCardDto, GetDebitCardsDto, UpdateDebitCardDto } from "./debit-cards.dto";
import { DebitCardsService } from "./debit-cards.service";

@ApiTags("debit-cards")
@ApiBearerAuth()
@Controller("debit-cards")
export class DebitCardsController {
  constructor(private readonly debitCardsService: DebitCardsService) {}

  @Post()
  async create(@CurrentUser() user: users, @Body() dto: CreateDebitCardDto) {
    return this.debitCardsService.create(user.id, dto);
  }

  @Get()
  async list(@CurrentUser() user: users, @Query() dto: GetDebitCardsDto) {
    return this.debitCardsService.list(user.id, dto);
  }

  @Get(":id")
  async getById(@CurrentUser() user: users, @Param("id") id: string) {
    return this.debitCardsService.getById(user.id, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() dto: UpdateDebitCardDto,
  ) {
    return this.debitCardsService.update(user.id, id, dto);
  }

  @Delete(":id")
  async remove(@CurrentUser() user: users, @Param("id") id: string) {
    return this.debitCardsService.remove(user.id, id);
  }
}
