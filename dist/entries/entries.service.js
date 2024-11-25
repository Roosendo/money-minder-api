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
exports.EntryService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const entries_dto_1 = require("./entries.dto");
const prisma_service_1 = require("../prisma.service");
let EntryService = class EntryService {
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async newEntry({ email, date, amount, category, description }) {
        const id = await this.prisma.money_entries.create({
            data: {
                user_email: email,
                date: new Date(date),
                amount,
                category,
                description
            },
            select: { entry_id: true }
        });
        await this.cacheManager.del(`entries_${email}`);
        return id;
    }
    async getEntries({ email }) {
        const cacheKey = `entries_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const entries = await this.prisma.money_entries.findMany({
            where: { user_email: email },
            orderBy: { entry_id: 'desc' },
            take: 15,
            select: {
                amount: true,
                description: true,
                category: true,
                date: true,
                entry_id: true
            }
        });
        await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 });
        return entries;
    }
    async getEntriesByCategoryMonthly({ email, month, year }) {
        const cacheKey = `monthlyEntries_entries_${email}_${month}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const entries = await this.prisma.money_entries.groupBy({
            by: ['category'],
            where: {
                user_email: email,
                date: {
                    gte: new Date(`${year}-${month}-01`),
                    lt: new Date(`${year}-${month}-32`)
                }
            },
            _sum: {
                amount: true,
            }
        });
        await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 });
        return entries;
    }
    async getMonthlySummary({ email, month, year }) {
        const cacheKey = `monthlySummary_entries_${email}_${month}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const entries = await this.prisma.money_entries.aggregate({
            where: {
                user_email: email,
                date: {
                    gte: new Date(`${year}-${month}-01`),
                    lt: new Date(`${year}-${month}-32`)
                }
            },
            _sum: {
                amount: true
            }
        });
        await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 });
        return entries;
    }
    async getYearlySummary({ email, year }) {
        const cacheKey = `yearlySummary_entries_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const entries = await this.prisma.money_entries.aggregate({
            where: {
                user_email: email,
                date: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year}-12-32`)
                }
            },
            _sum: {
                amount: true
            }
        });
        await this.cacheManager.set(cacheKey, entries, { ttl: 60 * 1000 });
        return entries;
    }
};
exports.EntryService = EntryService;
__decorate([
    (0, cache_manager_1.CacheKey)('entries'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.GetEntriesDto]),
    __metadata("design:returntype", Promise)
], EntryService.prototype, "getEntries", null);
__decorate([
    (0, cache_manager_1.CacheKey)('monthlyEntries_entries'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.MonthlyEntryDto]),
    __metadata("design:returntype", Promise)
], EntryService.prototype, "getEntriesByCategoryMonthly", null);
__decorate([
    (0, cache_manager_1.CacheKey)('mothlySummary_entries'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.MonthlyEntryDto]),
    __metadata("design:returntype", Promise)
], EntryService.prototype, "getMonthlySummary", null);
__decorate([
    (0, cache_manager_1.CacheKey)('yearlySummary_entries'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.YearlyEntryDto]),
    __metadata("design:returntype", Promise)
], EntryService.prototype, "getYearlySummary", null);
exports.EntryService = EntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], EntryService);
//# sourceMappingURL=entries.service.js.map