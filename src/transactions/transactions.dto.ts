import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { transaction_type } from "@prisma/client";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { IsMoney } from "@/common/validators/is-money.validator";

const toStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

export enum AdjustmentDirectionDto {
  increase = "increase",
  decrease = "decrease",
}

const NON_TRANSFER_TYPES = ["income", "expense", "adjustment"] as const;

export class CreateTransactionDto {
  @IsIn(NON_TRANSFER_TYPES)
  type: (typeof NON_TRANSFER_TYPES)[number];

  @Transform(toStringValue)
  @IsMoney({ positive: true })
  amount: string;

  @IsUUID()
  accountId: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @ValidateIf((dto: CreateTransactionDto) => dto.type === "adjustment")
  @IsEnum(AdjustmentDirectionDto)
  direction?: AdjustmentDirectionDto;
}

export class UpdateTransactionDto {
  @Transform(toStringValue)
  @IsMoney({ positive: true })
  @IsOptional()
  amount?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @IsEnum(AdjustmentDirectionDto)
  @IsOptional()
  direction?: AdjustmentDirectionDto;
}

export class GetTransactionsDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(transaction_type)
  type?: transaction_type;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeReversed?: boolean = true;
}

export class ReverseTransactionDto {
  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

export class DeleteTransactionDto {
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  hard?: boolean = false;
}

export class GetTransactionQueryDto {
  @Type(() => Boolean)
  @IsOptional()
  includeMovements?: boolean = true;
}
