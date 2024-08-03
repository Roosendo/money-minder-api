import { Controller, Post, Body, UseFilters } from '@nestjs/common'
import { EmailDto } from './email.dto'
import { EmailService } from './email.service'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('api/emails')
@UseFilters(AllExceptionsFilter)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-email')
  async sendEmail(@Body() emailDto: EmailDto) {
    await this.emailService.sendEmail(emailDto.email, emailDto.name, emailDto.message)
    return { message: 'Email sent successfully' }
  }
}
