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
  CreateAccountDto,
  GetAccountHistoryDto,
  GetAccountsDto,
  GetBalanceDto,
  GetBalanceRangeDto,
  UpdateAccountDto,
} from "./accounts.dto";
import { AccountsService } from "./accounts.service";

@ApiTags("accounts")
@ApiBearerAuth()
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: "List accounts with current balances" })
  async getAccounts(@CurrentUser() user: users, @Query() dto: GetAccountsDto) {
    return this.accountsService.getAccounts(user.id, dto.includeArchived, dto.asOf);
  }

  @Get("balances")
  @ApiOperation({ summary: "Current balance for every account" })
  async getBalances(@CurrentUser() user: users, @Query() dto: GetAccountsDto) {
    return this.accountsService.getAccounts(user.id, dto.includeArchived, dto.asOf);
  }

  @Post()
  @ApiOperation({ summary: "Create a cash, bank or savings account" })
  async createAccount(@CurrentUser() user: users, @Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(user.id, dto);
  }

  @Get(":id")
  async getAccount(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Query() dto: GetBalanceDto,
  ) {
    return this.accountsService.getAccount(user.id, id, dto.asOf);
  }

  @Patch(":id")
  async updateAccount(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(user.id, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archive an account without deleting its ledger history" })
  async archiveAccount(@CurrentUser() user: users, @Param("id") id: string) {
    return this.accountsService.archiveAccount(user.id, id);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Archive an account by default; hard delete only with ?hard=true",
  })
  async deleteAccount(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Query("hard", new DefaultValuePipe(false), ParseBoolPipe) hard: boolean,
  ) {
    return this.accountsService.deleteAccount(user.id, id, hard);
  }

  @Get(":id/balance")
  @ApiOperation({ summary: "Account balance at a specific date (defaults to now)" })
  async getBalance(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Query() dto: GetBalanceDto,
  ) {
    return this.accountsService.getAccount(user.id, id, dto.asOf);
  }

  @Get(":id/balances")
  @ApiOperation({ summary: "Daily historical balances over a date range" })
  async getDailyBalances(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Query() dto: GetBalanceRangeDto,
  ) {
    return this.accountsService.getDailyBalances(user.id, id, dto.from, dto.to);
  }

  @Get(":id/transactions")
  @ApiOperation({ summary: "Account transaction history with running balances" })
  async getHistory(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Query() dto: GetAccountHistoryDto,
  ) {
    return this.accountsService.getHistory(user.id, id, dto);
  }
}
