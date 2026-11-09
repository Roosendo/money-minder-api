import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { IsMoney } from "@/common/validators/is-money.validator";

const toStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

export class CreateTransferDto {
  @IsUUID()
  fromAccountId: string;

  @IsUUID()
  toAccountId: string;

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

export class UpdateTransferDto {
  @Transform(toStringValue)
  @IsMoney({ positive: true })
  @IsOptional()
  amount?: string;

  @Transform(toStringValue)
  @IsMoney({ allowZero: true })
  @IsOptional()
  fee?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class GetTransfersDto extends PaginationDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}

export class ReverseTransferDto {
  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

export class DeleteTransferDto {
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  hard?: boolean = false;
}
