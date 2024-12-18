import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator'

export class CreateExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number

  @IsString()
  @IsNotEmpty()
  category: string

  @IsString()
  @IsNotEmpty()
  date: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  fullName?: string

  @IsEmail()
  email: string

  @IsNumber()
  @IsOptional()
  creditCardId?: number

  @IsOptional()
  @IsBoolean()
  isCreditPayment: boolean
}

export class GetExitsDto {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class MonthlyExitDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Month must be a valid month (e.g., 01, 02, ..., 09, 10, 11, 12)'
  })
  month: string

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
  year: string
}

export class YearlyExitDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
  year: string
}
