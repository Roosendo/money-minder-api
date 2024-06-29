import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateSavingDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  @IsDateString(
    {},
    {
      message:
        'newReminderDate must be a valid ISO 8601 date string (e.g., 2024-06-24 or 2024-06-24T11:25:00).'
    }
  )
  endDate: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  fullName?: string

  @IsString()
  @IsNotEmpty()
  @IsDateString()
  startDate: string

  @IsNumber()
  @IsNotEmpty()
  targetAmount: number

  @IsNumber()
  @IsNotEmpty()
  currentAmount: number
}

export class GetSavingsDto {
  @IsNotEmpty()
  @IsEmail()
  email: string
}

export class DeleteSavingDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  id: string
}

export class UpdateSavingDto {
  @IsNotEmpty()
  @IsNumber()
  newCurrentAmount: number

  @IsNotEmpty()
  @IsDateString(
    {},
    {
      message:
        'newReminderDate must be a valid ISO 8601 date string (e.g., 2024-06-24 or 2024-06-24T11:25:00).'
    }
  )
  newEndDate: string

  @IsNotEmpty()
  @IsString()
  newSavingName: string

  @IsNotEmpty()
  @IsNumber()
  newTarget: number

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsNumber()
  id: number
}
