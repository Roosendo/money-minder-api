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
const prisma_service_1 = require("../prisma.service");
let ExitService = class ExitService {
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async newExpense({ email, date, amount, category, description, creditCardId, isCreditPayment }) {
        const id = await this.prisma.money_exits.create({
            data: {
                user_email: email,
                amount,
                description,
                category,
                date: new Date(date),
                credit_card_id: creditCardId,
                is_credit_payment: isCreditPayment
            },
            select: { exit_id: true }
        });
        await this.cacheManager.del(`exits_${email}`);
        return id;
    }
    async getExits({ email }) {
        const cacheKey = `exits_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.prisma.money_exits.findMany({
            where: { user_email: email },
            orderBy: { exit_id: 'desc' },
            take: 15,
            select: {
                amount: true,
                description: true,
                category: true,
                date: true,
                exit_id: true,
                credit_card_id: true,
                is_credit_payment: true
            }
        });
        await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 });
        return expenses;
    }
    async getExpensesByCategoryMonthly({ email, month, year }) {
        const cacheKey = `monthlyExpenses_exits_${email}_${month}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.prisma.money_exits.groupBy({
            by: ['category'],
            where: {
                user_email: email,
                date: { gte: new Date(`${year}-${month}-01`), lt: new Date(`${year}-${month}-32`) }
            },
            _sum: { amount: true }
        });
        await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 });
        return expenses;
    }
    async getMonthlySummary({ email, month, year }) {
        const cacheKey = `monthlySummary_exits_${email}_${month}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.prisma.money_exits.aggregate({
            where: {
                user_email: email,
                date: { gte: new Date(`${year}-${month}-01`), lt: new Date(`${year}-${month}-32`) }
            },
            _sum: { amount: true }
        });
        await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 });
        return expenses;
    }
    async getYearlySummary({ email, year }) {
        const cacheKey = `yearlySummary_exits_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const expenses = await this.prisma.money_exits.aggregate({
            where: {
                user_email: email,
                date: { gte: new Date(`${year}-01-01`), lt: new Date(`${year}-12-32`) }
            },
            _sum: { amount: true }
        });
        await this.cacheManager.set(cacheKey, expenses, { ttl: 60 * 1000 });
        return expenses;
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
    (0, cache_manager_1.CacheKey)('monthlyExpenses_exits'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.MonthlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getExpensesByCategoryMonthly", null);
__decorate([
    (0, cache_manager_1.CacheKey)('mothlySummary_exits'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.MonthlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getMonthlySummary", null);
__decorate([
    (0, cache_manager_1.CacheKey)('yearlySummary_exits'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.YearlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitService.prototype, "getYearlySummary", null);
exports.ExitService = ExitService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ExitService);
//# sourceMappingURL=exits.service.js.map