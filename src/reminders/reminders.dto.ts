import { reminder_recurrence, reminder_status } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsDateString()
  @IsNotEmpty()
  dueAt: string;

  @IsEnum(reminder_recurrence)
  @IsOptional()
  recurrence?: reminder_recurrence = reminder_recurrence.none;

  @IsEnum(reminder_status)
  @IsOptional()
  status?: reminder_status = reminder_status.pending;
}

export class UpdateReminderDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsEnum(reminder_recurrence)
  @IsOptional()
  recurrence?: reminder_recurrence;

  @IsEnum(reminder_status)
  @IsOptional()
  status?: reminder_status;
}
