import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { account_type } from "@prisma/client";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { IsMoney } from "@/common/validators/is-money.validator";

const toStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(account_type)
  @IsOptional()
  type?: account_type = "bank";

  @Transform(toStringValue)
  @IsMoney({ allowZero: true }, { message: "openingBalance must be a decimal string" })
  @IsOptional()
  openingBalance?: string = "0";

  @IsDateString()
  @IsOptional()
  openingBalanceDate?: string;
}

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @Transform(toStringValue)
  @IsMoney({ allowZero: true }, { message: "openingBalance must be a decimal string" })
  @IsOptional()
  openingBalance?: string;

  @IsDateString()
  @IsOptional()
  openingBalanceDate?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GetAccountsDto {
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean = false;

  @IsDateString()
  @IsOptional()
  asOf?: string;
}

export class GetBalanceDto {
  @IsDateString()
  @IsOptional()
  asOf?: string;
}

export class GetBalanceRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class GetAccountHistoryDto extends PaginationDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
