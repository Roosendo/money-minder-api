import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() _req: Request) { }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = this.authService.googleLogin(req)
    const frontendURL = `https://money-minder-xi.vercel.app/login?user=${encodeURIComponent(JSON.stringify(user))}`
    res.redirect(frontendURL)
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(@Req() _req: Request) { }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = this.authService.githubLogin(req)
    const frontendURL = `https://money-minder-xi.vercel.app/login?user=${encodeURIComponent(JSON.stringify(user))}`
    res.redirect(frontendURL)
  }
}
