import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { AddPaymentDto, CreateLoanDto, EditLoanDto, EditPaymentDto } from "./loans.dto";
import { LoansService } from "./loans.service";

@Controller("loans")
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  async newLoan(@CurrentUser() user: users, @Body() createLoanDto: CreateLoanDto) {
    return this.loansService.newLoan(user.id, createLoanDto);
  }

  @Get()
  async getLoans(@CurrentUser() user: users) {
    return this.loansService.getLoans(user.id);
  }

  @Get(":loanId")
  async getLoan(@CurrentUser() user: users, @Param("loanId") loanId: string) {
    return this.loansService.getLoanById(user.id, loanId);
  }

  @Patch(":loanId")
  async editLoan(
    @CurrentUser() user: users,
    @Param("loanId") loanId: string,
    @Body() editLoanDto: EditLoanDto,
  ) {
    return this.loansService.editLoan(user.id, loanId, editLoanDto);
  }

  @Delete(":loanId")
  async deleteLoan(@CurrentUser() user: users, @Param("loanId") loanId: string) {
    return this.loansService.deleteLoan(user.id, loanId);
  }

  @Post(":loanId/payments")
  async addPayment(
    @CurrentUser() user: users,
    @Param("loanId") loanId: string,
    @Body() addPaymentDto: AddPaymentDto,
  ) {
    return this.loansService.addPayment(user.id, loanId, addPaymentDto);
  }

  @Patch(":loanId/payments/:paymentId")
  async editPayment(
    @CurrentUser() user: users,
    @Param("loanId") loanId: string,
    @Param("paymentId") paymentId: string,
    @Body() editPaymentDto: EditPaymentDto,
  ) {
    return this.loansService.editPayment(user.id, loanId, paymentId, editPaymentDto);
  }

  @Delete(":loanId/payments/:paymentId")
  async deletePayment(
    @CurrentUser() user: users,
    @Param("loanId") loanId: string,
    @Param("paymentId") paymentId: string,
  ) {
    return this.loansService.deletePayment(user.id, loanId, paymentId);
  }
}
