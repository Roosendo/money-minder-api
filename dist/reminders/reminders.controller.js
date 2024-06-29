"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersController = void 0;
const common_1 = require("@nestjs/common");
const reminders_service_1 = require("./reminders.service");
const reminders_dto_1 = require("./reminders.dto");
const users_service_1 = require("../users/users.service");
const errors_1 = require("../middlewares/errors");
let RemindersController = class RemindersController {
    constructor(remindersService, usersService) {
        this.remindersService = remindersService;
        this.usersService = usersService;
    }
    async newReminder(createReminderDto) {
        const createUserDto = { email: createReminderDto.email, fullName: createReminderDto.fullName };
        await this.usersService.createUser(createUserDto);
        return this.remindersService.newReminder(createReminderDto);
    }
    async getReminders(getRemindersDto) {
        const reminders = await this.remindersService.getReminders(getRemindersDto);
        return reminders;
    }
    async deleteReminder(deleteReminderDto) {
        return this.remindersService.deleteReminder(deleteReminderDto);
    }
    async updateReminder(updateReminderDto) {
        return this.remindersService.updateReminder(updateReminderDto);
    }
};
exports.RemindersController = RemindersController;
__decorate([
    (0, common_1.Post)('new-reminder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reminders_dto_1.CreateReminderDto]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "newReminder", null);
__decorate([
    (0, common_1.Get)('get-reminders'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reminders_dto_1.GetRemindersDto]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "getReminders", null);
__decorate([
    (0, common_1.Delete)('delete-reminder'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reminders_dto_1.DeleteReminderDto]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "deleteReminder", null);
__decorate([
    (0, common_1.Patch)('update-reminder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reminders_dto_1.UpdateReminderDto]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "updateReminder", null);
exports.RemindersController = RemindersController = __decorate([
    (0, common_1.Controller)('api/reminders'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [reminders_service_1.RemindersService,
        users_service_1.UsersService])
], RemindersController);
//# sourceMappingURL=reminders.controller.js.map