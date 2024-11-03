import { AllExceptionsFilter } from '@/middlewares/errors'
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseFilters } from '@nestjs/common'
import { LoansService } from './loans.service'
import { UsersService } from '@/users/users.service'
import { CreateUserDto } from '@/users/users.dto'
import { APIResponse, AddPaymentDTO, CreateLoanDto, DeleteLoansDto, EditLoansDto, EditPaymentDto, GetLoansDto } from './loans.dto'

@Controller('api/loans')
@UseFilters(AllExceptionsFilter)
export class LoansController {
  constructor(
    private readonly loansService: LoansService,
    private readonly usersService: UsersService
  ) {}

  @Post('')
  async newLoan(@Body() createLoanDto: CreateLoanDto) {
    const createUserDto: CreateUserDto = {
      email: createLoanDto.userEmail,
      fullName: createLoanDto.fullName
    }
    await this.usersService.createUser(createUserDto)
    return this.loansService.newLoan(createLoanDto)
  }

  @Get('')
  async getLoans(@Query() getLoansDto: GetLoansDto) {
    const loans = await this.loansService.getLoans(getLoansDto)
    return (loans as unknown as APIResponse[]).map(loan => ({
      ...loan,
      last_five_payments: JSON.parse(loan.last_five_payments)
    }))
  }

  @Patch('/:loanId')
  async editLoan(@Body() editLoanDto: EditLoansDto, @Param('loanId') loanId: string) {
    return this.loansService.editLoan({ ...editLoanDto, loanId })
  }

  @Delete('/:loanId')
  async deleteLoan(@Body() deleteLoanDto: DeleteLoansDto, @Param('loanId') loanId: string) {
    return this.loansService.deleteLoan({ ...deleteLoanDto, loanId })
  }

  @Post('/payments')
  async addPayment(@Body() addPaymentDto: AddPaymentDTO) {
    return this.loansService.addPayment(addPaymentDto)
  }

  @Patch('/payments/edit')
  async editPayment(@Body() editPaymentDto: EditPaymentDto) {
    return this.loansService.editPayment(editPaymentDto)
  }
}