import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import {
  CreateTransferDto,
  DeleteTransferDto,
  GetTransfersDto,
  ReverseTransferDto,
  UpdateTransferDto,
} from "./transfers.dto";
import { TransfersService } from "./transfers.service";

@ApiTags("transfers")
@ApiBearerAuth()
@Controller("transfers")
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({
    summary: "Create a transfer; fees debit the source but are not income/expense transactions",
  })
  async create(@CurrentUser() user: users, @Body() dto: CreateTransferDto) {
    return this.transfersService.create(user.id, dto);
  }

  @Get()
  async list(@CurrentUser() user: users, @Query() dto: GetTransfersDto) {
    return this.transfersService.list(user.id, dto);
  }

  @Get(":transactionId")
  async getById(@CurrentUser() user: users, @Param("transactionId") transactionId: string) {
    return this.transfersService.getById(user.id, transactionId);
  }

  @Get(":transactionId/movements")
  async getMovements(@CurrentUser() user: users, @Param("transactionId") transactionId: string) {
    return this.transfersService.getMovements(user.id, transactionId);
  }

  @Patch(":transactionId")
  async update(
    @CurrentUser() user: users,
    @Param("transactionId") transactionId: string,
    @Body() dto: UpdateTransferDto,
  ) {
    return this.transfersService.update(user.id, transactionId, dto);
  }

  @Delete(":transactionId")
  @ApiOperation({
    summary: "Reverse a transfer by default; hard delete only with ?hard=true",
  })
  async remove(
    @CurrentUser() user: users,
    @Param("transactionId") transactionId: string,
    @Query() dto: DeleteTransferDto,
  ) {
    return this.transfersService.remove(user.id, transactionId, dto);
  }

  @Post(":transactionId/reverse")
  async reverse(
    @CurrentUser() user: users,
    @Param("transactionId") transactionId: string,
    @Body() dto: ReverseTransferDto,
  ) {
    return this.transfersService.reverse(user.id, transactionId, dto);
  }
}
