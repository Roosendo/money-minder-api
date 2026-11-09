import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import {
  CreateTransactionDto,
  DeleteTransactionDto,
  GetTransactionsDto,
  ReverseTransactionDto,
  UpdateTransactionDto,
} from "./transactions.dto";
import { TransactionsService } from "./transactions.service";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: "Create an income, expense or adjustment transaction" })
  async create(@CurrentUser() user: users, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List transactions with filters and pagination" })
  async list(@CurrentUser() user: users, @Query() dto: GetTransactionsDto) {
    return this.transactionsService.list(user.id, dto);
  }

  @Get(":id")
  async getById(@CurrentUser() user: users, @Param("id") id: string) {
    return this.transactionsService.getById(user.id, id);
  }

  @Get(":id/movements")
  @ApiOperation({ summary: "Account movements attached to a transaction" })
  async getMovements(@CurrentUser() user: users, @Param("id") id: string) {
    const transaction = await this.transactionsService.getById(user.id, id);
    return transaction.movements;
  }

  @Patch(":id")
  @ApiOperation({ summary: "Correct a transaction (recalculates its movements atomically)" })
  async update(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Reverse a transaction by default; hard delete only with ?hard=true",
  })
  async remove(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Query() dto: DeleteTransactionDto,
  ) {
    return this.transactionsService.remove(user.id, id, dto);
  }

  @Post(":id/reverse")
  @ApiOperation({ summary: "Create a compensating reversal transaction" })
  async reverse(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() dto: ReverseTransactionDto,
  ) {
    return this.transactionsService.reverse(user.id, id, dto);
  }
}
