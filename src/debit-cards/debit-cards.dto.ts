import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import { PaginationDto } from "@/common/dto/pagination.dto";

export class CreateDebitCardDto {
  @IsUUID()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}$/, { message: "last4 must be exactly 4 digits" })
  last4?: string;
}

export class UpdateDebitCardDto {
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}$/, { message: "last4 must be exactly 4 digits" })
  last4?: string;
}

export class GetDebitCardsDto extends PaginationDto {
  @IsUUID()
  @IsOptional()
  accountId?: string;
}
