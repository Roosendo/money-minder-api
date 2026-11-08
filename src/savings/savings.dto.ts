import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSavingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  targetAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentAmount?: number = 0;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}

export class UpdateSavingDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  targetAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentAmount?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
