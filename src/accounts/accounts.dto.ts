import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  openingBalance?: number;
}

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  openingBalance?: number;
}
