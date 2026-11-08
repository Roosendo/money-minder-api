import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export class CreateCreditCardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @Length(4, 4, { message: "last4 must be exactly 4 digits" })
  last4?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  creditLimit: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  statementDay: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;
}

export class EditCreditCardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  last4?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  statementDay?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;
}
