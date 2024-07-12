import { Injectable } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class AuthService {
  googleLogin(req: Request) {
    if (!req.user) return 'No user from google'

    return { user: req.user }
  }
}
