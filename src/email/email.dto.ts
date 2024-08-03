import { IsEmail, IsString, IsNotEmpty } from 'class-validator'

export class EmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  message: string
}
