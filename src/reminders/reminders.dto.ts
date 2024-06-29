import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateReminderDto {
  @IsString()
  @IsOptional()
  description?: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsOptional()
  fullName?: string

  @IsString()
  @IsDateString(
    {},
    {
      message:
        'reminderDate must be a valid ISO 8601 date string (e.g., 2024-06-24 or 2024-06-24T11:25:00).'
    }
  )
  @IsNotEmpty()
  reminderDate: string

  @IsString()
  @IsNotEmpty()
  title: string
}

export class GetRemindersDto {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class DeleteReminderDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  id: string
}

export class UpdateReminderDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsNumber()
  @IsNotEmpty()
  id: number

  @IsString()
  @IsNotEmpty()
  newDescription: string

  @IsString()
  @IsDateString(
    {},
    {
      message:
        'newReminderDate must be a valid ISO 8601 date string (e.g., 2024-06-24 or 2024-06-24T11:25:00).'
    }
  )
  @IsNotEmpty()
  newDate: string

  @IsString()
  @IsNotEmpty()
  newTitle: string
}
