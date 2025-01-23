import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    googleAuth(_req: Request): Promise<void>;
    googleAuthRedirect(req: Request, res: Response): void;
    githubAuth(_req: Request): Promise<void>;
    githubAuthRedirect(req: Request, res: Response): void;
}
