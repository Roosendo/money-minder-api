import { Module } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { UsersModule } from '@/users/users.module'
import { EntryController } from './entries.controller'
import { EntryService } from './entries.service'

@Module({
  imports: [UsersModule],
  controllers: [EntryController],
  providers: [EntryService, PrismaService]
})
export class EntryModule { }
