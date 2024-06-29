import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator'

export class CreateEntryDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsString()
  date: string

  @IsNumber()
  @IsNotEmpty()
  amount: number

  @IsString()
  @IsNotEmpty()
  category: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  fullName?: string
}

export class GetEntriesDto {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class MonthlyEntryDto {
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

export class YearlyEntryDto {
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
