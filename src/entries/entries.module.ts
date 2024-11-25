import { Module } from '@nestjs/common'
import { EntryController } from './entries.controller'
import { EntryService } from './entries.service'
import { UsersModule } from '@/users/users.module'
import { PrismaService } from '@/prisma.service'

@Module({
  imports: [UsersModule],
  controllers: [EntryController],
  providers: [EntryService, PrismaService]
})
export class EntryModule {}
