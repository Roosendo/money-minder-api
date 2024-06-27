import { Module } from '@nestjs/common'
import { EntryController } from './entries.controller'
import { EntryService } from './entries.service'
import { DatabaseModule } from '@/config/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [EntryController],
  providers: [EntryService]
})
export class EntryModule {}
