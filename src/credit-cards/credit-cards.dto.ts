import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateCreditCardDto {
  @IsString()
  @IsOptional()
  fullName?: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  name: string

  @IsString()
  @IsNotEmpty()
  cutOffDate: string

  @IsString()
  @IsNotEmpty()
  paymentDueDate: string
}

export class GetCreditCardsDto {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class EditCreditCardDto {
  @IsOptional()
  @IsString()
  creditCardId?: string

  @IsEmail()
  @IsNotEmpty()
  userEmail: string

  @IsNotEmpty()
  @IsString()
  name?: string

  @IsString()
  @IsNotEmpty()
  cutOffDate?: string

  @IsString()
  @IsOptional()
  paymentDueDate?: string
}

export class DeleteCreditCardDto {
  @IsOptional()
  @IsString()
  creditCardId: string

  @IsEmail()
  @IsNotEmpty()
  userEmail: string
}
