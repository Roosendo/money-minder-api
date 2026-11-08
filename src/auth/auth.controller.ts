import { All, Controller, Get, Req, Res } from "@nestjs/common";
import { toNodeHandler } from "better-auth/node";
import type { Request, Response } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import type { users } from "@prisma/client";
import { getBetterAuthInstance } from "./auth";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @All("*")
  async handleBetterAuth(@Req() req: Request, @Res() res: Response) {
    const auth = getBetterAuthInstance();
    return toNodeHandler(auth)(req, res);
  }

  @Get("me")
  async getMe(@CurrentUser() user: users) {
    return this.authService.getProfile(user.id);
  }
}
