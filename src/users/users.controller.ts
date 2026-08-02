import { Controller, Injectable, UseFilters } from '@nestjs/common'
import { AllExceptionsFilter } from '@/middlewares/errors'
import { CreateUserDto } from './users.dto'
import { UsersService } from './users.service'

@Controller()
@Injectable()
@UseFilters(AllExceptionsFilter)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  async createUser(createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto)
  }
}
