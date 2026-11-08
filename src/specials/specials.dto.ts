import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class FinancialSummaryMonthlyDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class FinancialSummaryYearlyDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;
}

export class CashFlowDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;
}

export class CategoriesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;
}

export class RecentTransactionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;
}
