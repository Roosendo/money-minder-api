import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  private readonly resend = new Resend(this.configService.get<string>('RESEND_TOKEN') ?? '')

  async sendEmail(email: string, name: string, message: string) {
    await this.resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['grosendoh73@gmail.com'],
      subject: 'Message from ' + name,
      text: `Contact: ${email}\n\n${message}`
    })
  }
}
