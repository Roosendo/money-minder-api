import { Module } from '@nestjs/common'
import { EntryController } from './entries.controller'
import { EntryService } from './entries.service'
import { DatabaseModule } from '@/config/database.module'
import { UsersModule } from '@/users/users.module'

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [EntryController],
  providers: [EntryService]
})
export class EntryModule { }
