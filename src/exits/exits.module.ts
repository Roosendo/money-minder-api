import { Module } from '@nestjs/common'
import { ExitController } from './exits.controller'
import { ExitService } from './exits.service'
import { DatabaseModule } from '@/config/database.module'
import { UsersModule } from '@/users/users.module'

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [ExitController],
  providers: [ExitService]
})
export class ExitModule {}
