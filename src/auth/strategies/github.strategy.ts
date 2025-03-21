import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-github2'

import { Injectable } from '@nestjs/common'

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://money-minder-api-mqz9.onrender.com/api/github/redirect',
      scope: ['user:email']
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    _done: () => void
  ): Promise<any> {
    const { username, emails, photos } = profile
    const user = {
      email: emails?.[0]?.value || '',
      firstName: profile?.name?.givenName || username || '',
      lastName: profile?.name?.familyName || '',
      picture: photos?.[0]?.value || ''
    }
    return user
  }
}
