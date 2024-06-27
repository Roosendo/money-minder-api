import { Module } from '@nestjs/common'
import { SavingsService } from './savings.service'
import { SavingsController } from './savings.controller'
import { DatabaseModule } from '@/config/database.module'
import { UsersModule } from '@/users/users.module'

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [SavingsService],
  controllers: [SavingsController]
})
export class SavingsModule { }
