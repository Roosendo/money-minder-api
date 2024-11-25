import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './users.dto'
import { PrismaService } from '@/prisma.service'

@Injectable()
export class UsersService {
  constructor( private prisma: PrismaService) {}

  async createUser({ email, fullName }: CreateUserDto) {
    const user = await this.prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      await this.prisma.users.create({
        data: {
          email,
          full_name: fullName
        }
      })
    }
  }
}
