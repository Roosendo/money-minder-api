import { Module } from '@nestjs/common'
import { ExitController } from './exits.controller'
import { ExitService } from './exits.service'
import { DatabaseModule } from '@/config/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [ExitController],
  providers: [ExitService]
})
export class ExitModule {}
