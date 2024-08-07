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
let RemindersService = class RemindersService {
    constructor(client, cacheManager) {
        this.client = client;
        this.cacheManager = cacheManager;
    }
    async newReminder({ email, title, description, reminderDate }) {
        const result = await this.client.execute({
            sql: 'INSERT INTO reminders (user_email, title, description, reminder_date) VALUES (?, ?, ?, ?) RETURNING id',
            args: [email, title, description, reminderDate]
        });
        await this.cacheManager.del(`reminders_${email}`);
        const id = result.rows[0]?.id;
        return { id };
    }
    async getReminders({ email }) {
        const cacheKey = `reminders_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const reminders = await this.client.execute({
            sql: 'SELECT id, title, description, reminder_date FROM reminders WHERE user_email = ?',
            args: [email]
        });
        return reminders.rows;
    }
    async deleteReminder({ email, id }) {
        await this.client.execute({
            sql: 'DELETE FROM reminders WHERE user_email = ? AND id = ?',
            args: [email, id]
        });
        await this.cacheManager.del(`reminders_${email}`);
    }
    async updateReminder({ email, id, newTitle, newDescription, newDate }) {
        await this.client.execute({
            sql: 'UPDATE reminders SET title = ?, description = ?, reminder_date = ? WHERE user_email = ? AND id = ?',
            args: [newTitle, newDescription, newDate, email, id]
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
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map