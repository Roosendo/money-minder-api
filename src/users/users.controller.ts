import { UseFilters, Injectable, Controller } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './users.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller()
@Injectable()
@UseFilters(AllExceptionsFilter)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto)
  }
}
