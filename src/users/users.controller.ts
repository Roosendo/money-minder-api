import { Body, Controller, Get, Patch } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { users } from "@prisma/client";
import { UpdateUserDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getProfile(@CurrentUser() user: users) {
    return this.usersService.getProfile(user.id);
  }

  @Patch("me")
  async updateProfile(@CurrentUser() user: users, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
