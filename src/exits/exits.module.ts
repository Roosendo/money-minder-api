import { Module } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { UsersModule } from '@/users/users.module'
import { ExitController } from './exits.controller'
import { ExitService } from './exits.service'

@Module({
  imports: [UsersModule],
  controllers: [ExitController],
  providers: [ExitService, PrismaService]
})
export class ExitModule { }
