import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'

import { Injectable } from '@nestjs/common'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://money-minder-api-mqz9.onrender.com/api/google/redirect',
      scope: ['email', 'profile']
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    _done: VerifyCallback
  ): Promise<any> {
    const { name, emails, photos } = profile
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value
    }
    return user
  }
}
