import { loan_direction, loan_status } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateLoanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(loan_direction)
  @IsNotEmpty()
  direction: loan_direction;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  principal: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  interestRate?: number = 0;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(loan_status)
  @IsOptional()
  status?: loan_status = loan_status.active;
}

export class EditLoanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(loan_direction)
  @IsOptional()
  direction?: loan_direction;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  principal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  interestRate?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(loan_status)
  @IsOptional()
  status?: loan_status;
}

export class AddPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class EditPaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
