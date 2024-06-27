import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

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

export class GetEntriesByCategoryMonthlyDto {
  @IsEmail()
  @IsNotEmpty()
    email: string

  @IsNotEmpty()
  @IsString()
    month: string

  @IsNotEmpty()
  @IsString()
    year: string
}
