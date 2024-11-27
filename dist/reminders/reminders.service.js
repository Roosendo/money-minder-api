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
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const reminders_dto_1 = require("./reminders.dto");
const prisma_service_1 = require("../prisma.service");
let RemindersService = class RemindersService {
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async newReminder({ email, title, description, reminderDate }) {
        const result = await this.prisma.reminders.create({
            data: {
                user_email: email,
                title,
                description,
                reminder_date: new Date(reminderDate)
            },
            select: { id: true }
        });
        await this.cacheManager.del(`reminders_${email}`);
        return { id: result.id };
    }
    async getReminders({ email }) {
        const cacheKey = `reminders_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const reminders = await this.prisma.reminders.findMany({
            where: { user_email: email },
            select: { id: true, title: true, description: true, reminder_date: true }
        });
        return reminders;
    }
    async deleteReminder({ email, id }) {
        await this.prisma.reminders.delete({
            where: { user_email: email, id: +id }
        });
        await this.cacheManager.del(`reminders_${email}`);
    }
    async updateReminder({ email, id, newTitle, newDescription, newDate }) {
        await this.prisma.reminders.update({
            where: { user_email: email, id: +id },
            data: { title: newTitle, description: newDescription, reminder_date: newDate }
        });
        await this.cacheManager.del(`reminders_${email}`);
    }
};
exports.RemindersService = RemindersService;
__decorate([
    (0, cache_manager_1.CacheKey)('reminders'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reminders_dto_1.GetRemindersDto]),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "getReminders", null);
exports.RemindersService = RemindersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map