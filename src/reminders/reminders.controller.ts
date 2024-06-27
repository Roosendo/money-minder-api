import { Controller, Post, Get, Delete, Body, Query, UseFilters, Patch } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import {
  CreateReminderDto,
  GetRemindersDto,
  DeleteReminderDto,
  UpdateReminderDto
} from './reminders.dto'
import { UsersService } from '@/users/users.service'
import { CreateUserDto } from '@/users/users.dto'
import { AllExceptionsFilter } from '@/middlewares/errors'

@Controller('reminders')
@UseFilters(AllExceptionsFilter)
export class RemindersController {
  constructor (
    private readonly remindersService: RemindersService,
    private readonly usersService: UsersService
  ) { }

  @Post('new-reminder')
  async newReminder (@Body() createReminderDto: CreateReminderDto) {
    const createUserDto: CreateUserDto = { email: createReminderDto.email, fullName: createReminderDto.fullName }
    await this.usersService.createUser(createUserDto)
    return this.remindersService.newReminder(createReminderDto)
  }

  @Get('get-reminders')
  async getReminders (@Query() getRemindersDto: GetRemindersDto) {
    const reminders = await this.remindersService.getReminders(getRemindersDto)
    return reminders
  }

  @Delete('delete-reminder')
  async deleteReminder (@Body() deleteReminderDto: DeleteReminderDto) {
    return this.remindersService.deleteReminder(deleteReminderDto)
  }

  @Patch('update-reminder')
  async updateReminder (@Body() updateReminderDto: UpdateReminderDto) {
    return this.remindersService.updateReminder(updateReminderDto)
  }
}
