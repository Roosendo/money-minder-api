import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateLoanDto {
  @IsString()
  @IsOptional()
  fullName: string

  @IsString()
  @IsNotEmpty()
  userEmail: string

  @IsString()
  @IsNotEmpty()
  loanTitle: string

  @IsString()
  @IsNotEmpty()
  bankName: string

  @IsNumber()
  @IsNotEmpty()
  interestRate: number

  @IsNumber()
  @IsNotEmpty()
  loanAmount: number

  @IsString()
  @IsNotEmpty()
  loanStartDate: string

  @IsString()
  @IsNotEmpty()
  loanEndDate: string
}

export class GetLoansDto {
  @IsString()
  @IsNotEmpty()
  email: string
}

export class EditLoansDto {
  @IsString()
  @IsNotEmpty()
  loanId: string

  @IsString()
  @IsNotEmpty()
  userEmail: string

  @IsString()
  @IsNotEmpty()
  loanTitle: string

  @IsString()
  @IsNotEmpty()
  bankName: string

  @IsNumber()
  @IsNotEmpty()
  interestRate: number

  @IsNumber()
  @IsNotEmpty()
  loanAmount: number

  @IsString()
  @IsNotEmpty()
  loanStartDate: string

  @IsString()
  @IsNotEmpty()
  loanEndDate: string
}

export class DeleteLoansDto {
  @IsString()
  @IsOptional()
  loanId?: string

  @IsString()
  @IsNotEmpty()
  userEmail: string
}

export class AddPaymentDTO {
  @IsNumber()
  @IsNotEmpty()
  loanId: number

  @IsString()
  @IsNotEmpty()
  paymentDate: string

  @IsNumber()
  @IsNotEmpty()
  paymentAmount: number
}

export class EditPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  paymentId: number

  @IsString()
  @IsNotEmpty()
  paymentDate: string

  @IsNumber()
  @IsNotEmpty()
  paymentAmount: number

  @IsString()
  @IsNotEmpty()
  email: string
}

export interface APIResponse {
  loan_title: string
  bank_name: string
  interest_rate: number
  loan_amount: number
  loan_start_date: string
  loan_end_date: string
  last_five_payments: string
  total_payments: number
}
