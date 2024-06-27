import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator'

export class FinancialSummaryMonthlyDto {
  @IsEmail()
  @IsNotEmpty()
    email: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
    year: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Month must be a valid month (e.g., 01, 02, ..., 09, 10, 11, 12)'
  })
    month: string
}

export class FinancialSummaryYearlyDto {
  @IsEmail()
  @IsNotEmpty()
    email: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
    year: string
}

export class CashFlowDto {
  @IsEmail()
  @IsNotEmpty()
    email: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
    year: string
}

export class CategoriesDto {
  @IsEmail()
  @IsNotEmpty()
    email: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
    year: string
}

export class RecentTransactionsDto {
  @IsEmail()
  @IsNotEmpty()
    email: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Year must be a valid year (e.g., 2023)'
  })
    year: string
}
