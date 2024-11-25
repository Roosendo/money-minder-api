import { Module } from '@nestjs/common'
import { ExitController } from './exits.controller'
import { ExitService } from './exits.service'
import { UsersModule } from '@/users/users.module'
import { PrismaService } from '@/prisma.service'

@Module({
  imports: [UsersModule],
  controllers: [ExitController],
  providers: [ExitService, PrismaService]
})
export class ExitModule {}
