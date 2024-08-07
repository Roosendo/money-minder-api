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
exports.ExitService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const exits_dto_1 = require("./exits.dto");
let ExitService = class ExitService {
    constructor(client, cacheManager) {
        this.client = client;
        this.cacheManager = cacheManager;
    }
    async newExpense({ email, date, amount, category, description }) {
        await this.client.execute({
            sql: 'INSERT INTO money_exits (user_email, amount, description, category, date) VALUES (?, ?, ?, ?, ?)',
            args: [email, amount, description, category, date]
        });
        await this.cacheManager.del(`exits_${email}`);
    }
    async getExits({ email }) {
        const cacheKey = `exits_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.client.execute({
            sql: 'SELECT amount, description, category, date, exit_id FROM money_exits WHERE user_email = ? ORDER BY exit_id DESC LIMIT 15',
            args: [email]
        });
        await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 });
        return expenses.rows;
    }
    async getExpensesByCategoryMonthly({ email, month, year }) {
        const cacheKey = `monthlyExpenses_${email}_${month}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.client.execute({
            sql: 'SELECT category, SUM(amount) AS total FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
            args: [email, month, year]
        });
        await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 });
        return expenses.rows;
    }
    async getMonthlySummary({ email, month, year }) {
        const cacheKey = `monthlySummary_${email}_${month}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.client.execute({
            sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
            args: [email, month, year]
        });
        await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 });
        return expenses.rows;
    }
    async getYearlySummary({ email, year }) {
        const cacheKey = `yearlySummary_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.client.execute({
            sql: 'SELECT SUM(amount) AS totalExits FROM money_exits WHERE user_email = ? AND strftime("%Y", date) = ?',
            args: [email, year]
        });
        await this.cacheManager.set(cacheKey, expenses.rows, { ttl: 60 * 1000 });
        return expenses.rows;
    }
};
exports.ExitService = ExitService;
__decorate([
    (0, cache_manager_1.CacheKey)('exits'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.GetExitsDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getExits", null);
__decorate([
    (0, cache_manager_1.CacheKey)('monthlyExpenses'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.MonthlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getExpensesByCategoryMonthly", null);
__decorate([
    (0, cache_manager_1.CacheKey)('mothlySummary'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.MonthlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getMonthlySummary", null);
__decorate([
    (0, cache_manager_1.CacheKey)('yearlySummary'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.YearlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getYearlySummary", null);
exports.ExitService = ExitService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], ExitService);
//# sourceMappingURL=exits.service.js.map