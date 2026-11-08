import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { CreateAccountDto, UpdateAccountDto } from "./accounts.dto";
import { AccountsService } from "./accounts.service";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAccounts(@CurrentUser() user: users) {
    return this.accountsService.getAccounts(user.id);
  }

  @Post()
  async createAccount(@CurrentUser() user: users, @Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(user.id, dto);
  }

  @Patch(":id")
  async updateAccount(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(user.id, id, dto);
  }

  @Delete(":id")
  async deleteAccount(@CurrentUser() user: users, @Param("id") id: string) {
    return this.accountsService.deleteAccount(user.id, id);
  }
}
