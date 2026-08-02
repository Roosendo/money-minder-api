import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma.service'
import { CreateUserDto } from './users.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

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
