import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser({ email, name, avatarUrl }: CreateUserDto) {
    return this.prisma.users.upsert({
      where: { email },
      update: {
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      },
      create: {
        email,
        name,
        avatar_url: avatarUrl,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateProfile(userId: string, { name, avatarUrl }: UpdateUserDto) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      },
    });
  }
}
