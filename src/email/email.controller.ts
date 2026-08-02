import { Body, Controller, Post, UseFilters } from '@nestjs/common'
import { AllExceptionsFilter } from '@/middlewares/errors'
import { EmailDto } from './email.dto'
import { EmailService } from './email.service'

@Controller('api/emails')
@UseFilters(AllExceptionsFilter)
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @Post('send-email')
  async sendEmail(@Body() emailDto: EmailDto) {
    await this.emailService.sendEmail(emailDto.email, emailDto.name, emailDto.message)
    return { message: 'Email sent successfully' }
  }
}
