import { Module } from '@nestjs/common'
import { SavingsService } from './savings.service'
import { SavingsController } from './savings.controller'
import { DatabaseModule } from '@/config/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [SavingsService],
  controllers: [SavingsController]
})
export class SavingsModule { }
