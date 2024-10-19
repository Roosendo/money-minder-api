import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

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

  @IsString()
  @IsNotEmpty()
  loanDate: string

  @IsString()
  @IsNotEmpty()
  interestRate: string

  @IsString()
  @IsNotEmpty()
  monthlyPayment: string

  @IsString()
  @IsNotEmpty()
  totalPaid: string
}

export class GetLoansDto {
  @IsString()
  @IsNotEmpty()
  email: string
}

export class EditLoansDto {
  @IsString()
  @IsNotEmpty()
  loanId?: string

  @IsString()
  @IsNotEmpty()
  userEmail: string

  @IsString()
  @IsNotEmpty()
  loanTitle?: string

  @IsString()
  @IsNotEmpty()
  bankName?: string

  @IsString()
  @IsNotEmpty()
  loanDate?: string

  @IsString()
  @IsNotEmpty()
  interestRate?: string

  @IsString()
  @IsNotEmpty()
  monthlyPayment?: string

  @IsString()
  @IsNotEmpty()
  totalPaid?: string
}

export class DeleteLoansDto {
  @IsString()
  @IsOptional()
  loanId?: string

  @IsString()
  @IsNotEmpty()
  userEmail: string
}
