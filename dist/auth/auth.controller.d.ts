import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    googleAuth(_req: Request): Promise<void>;
    googleAuthRedirect(req: Request, res: Response): void;
}
