import { EmailDto } from './email.dto';
import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    sendEmail(emailDto: EmailDto): Promise<{
        message: string;
    }>;
}
