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
exports.SpecialsService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const specials_dto_1 = require("./specials.dto");
const specials_utils_1 = require("./specials.utils");
let SpecialsService = class SpecialsService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    async getCashFlow({ email, year }) {
        const cacheKey = `financialSummaryYearly_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const result = await (0, specials_utils_1.getMonthlyBalance)(year, email);
        await this.cacheManager.set(cacheKey, result, { ttl: 60 * 1000 });
        return result;
    }
    async getCategories({ email, year }) {
        const cacheKey = `categories_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const categories = await (0, specials_utils_1.getCategoryTotalsDetailed)(year, email);
        await this.cacheManager.set(cacheKey, categories, { ttl: 60 * 1000 });
        return categories;
    }
    async getRecentTransactions({ email, year }) {
        const cacheKey = `recentTransactions_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const transactions = await (0, specials_utils_1.getLatestTransactions)(year, email);
        await this.cacheManager.set(cacheKey, transactions, { ttl: 60 * 1000 });
        return transactions;
    }
};
exports.SpecialsService = SpecialsService;
__decorate([
    (0, cache_manager_1.CacheKey)('financialSummaryYearly'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.CashFlowDto]),
    __metadata("design:returntype", Promise)
], SpecialsService.prototype, "getCashFlow", null);
__decorate([
    (0, cache_manager_1.CacheKey)('categories'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.CategoriesDto]),
    __metadata("design:returntype", Promise)
], SpecialsService.prototype, "getCategories", null);
__decorate([
    (0, cache_manager_1.CacheKey)('recentTransactions'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.RecentTransactionsDto]),
    __metadata("design:returntype", Promise)
], SpecialsService.prototype, "getRecentTransactions", null);
exports.SpecialsService = SpecialsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], SpecialsService);
//# sourceMappingURL=specials.service.js.map