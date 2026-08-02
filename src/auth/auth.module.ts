import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { GitHubStrategy } from './strategies/github.strategy'
import { GoogleStrategy } from './strategies/google.strategy'

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, GitHubStrategy]
})
export class AuthModule { }
