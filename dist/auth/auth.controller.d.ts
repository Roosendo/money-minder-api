import { AuthService } from './auth.service';
import { Request } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    googleAuth(_req: Request): Promise<void>;
    googleAuthRedirect(req: Request): "No user from google" | {
        user: Express.User;
    };
}
