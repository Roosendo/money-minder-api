import { AllExceptionsFilter } from '@/middlewares/errors'
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseFilters } from '@nestjs/common'
import { LoansService } from './loans.service'
import { UsersService } from '@/users/users.service'
import { CreateUserDto } from '@/users/users.dto'
import { CreateLoanDto, DeleteLoansDto, GetLoansDto } from './loans.dto'

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
    return loans
  }

  @Put('/:loanId')
  async editLoan(@Body() editLoanDto: CreateLoanDto, @Param('loanId') loanId: string) {
    return this.loansService.editLoan({ ...editLoanDto, loanId })
  }

  @Delete('/:loanId')
  async deleteLoan(@Body() deleteLoanDto: DeleteLoansDto, @Param('loanId') loanId: string) {
    return this.loansService.deleteLoan({ ...deleteLoanDto, loanId })
  }
}