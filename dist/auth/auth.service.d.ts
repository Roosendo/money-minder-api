import { Request } from 'express';
export declare class AuthService {
    googleLogin(req: Request): "No user from google" | {
        user: Express.User;
    };
}
