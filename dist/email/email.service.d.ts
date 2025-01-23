import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    constructor(configService: ConfigService);
    private readonly resend;
    sendEmail(email: string, name: string, message: string): Promise<void>;
}
