import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

export class MonthlyReportDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeTransferFees?: boolean = false;
}

export class YearlyReportDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeTransferFees?: boolean = false;
}

export class RangeReportDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeTransferFees?: boolean = false;
}

export class ExpenseBreakdownDto extends RangeReportDto {
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeTransferFees?: boolean = false;
}

export class AccountBalancesReportDto {
  @IsDateString()
  @IsOptional()
  asOf?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean = false;
}

export class CashFlowReportDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;
}

export class MonthlySummariesReportDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  includeTransferFees?: boolean = false;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "asc";
}
