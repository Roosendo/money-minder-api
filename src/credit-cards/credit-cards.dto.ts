import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { IsMoney } from "@/common/validators/is-money.validator";

const toStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

export class CreateCreditCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(toStringValue)
  @IsMoney({ positive: true })
  creditLimit: string;

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

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}$/, { message: "last4 must be exactly 4 digits" })
  last4?: string;

  @Transform(toStringValue)
  @IsMoney({ allowZero: true })
  @IsOptional()
  openingBalance?: string = "0";

  @IsDateString()
  @IsOptional()
  openingBalanceDate?: string;

  @IsUUID()
  @IsOptional()
  paymentAccountId?: string;
}

export class UpdateCreditCardDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @Transform(toStringValue)
  @IsMoney({ positive: true })
  @IsOptional()
  creditLimit?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  statementDay?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}$/, { message: "last4 must be exactly 4 digits" })
  last4?: string;

  @ValidateIf((_dto, value) => value !== undefined && value !== null)
  @IsUUID()
  @IsOptional()
  paymentAccountId?: string | null;

  @Transform(toStringValue)
  @IsMoney({ allowZero: true })
  @IsOptional()
  openingBalance?: string;

  @IsDateString()
  @IsOptional()
  openingBalanceDate?: string;
}

export class GetCreditCardsDto {
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean = false;
}

export class CreditCardPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  fromAccountId: string;

  @Transform(toStringValue)
  @IsMoney({ positive: true })
  amount: string;

  @Transform(toStringValue)
  @IsMoney({ allowZero: true })
  @IsOptional()
  fee?: string = "0";

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
