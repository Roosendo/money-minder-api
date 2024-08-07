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
let SpecialsService = class SpecialsService {
    constructor(client, cacheManager) {
        this.client = client;
        this.cacheManager = cacheManager;
    }
    async getCashFlow({ email, year }) {
        const cacheKey = `financialSummaryYearly_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const cashFlow = await this.client.execute({
            sql: `SELECT
            month,
            SUM(total_ingresos) AS total_ingresos,
            SUM(total_egresos) AS total_egresos
          FROM
            (
              SELECT
                STRFTIME('%m', DATE) AS month,
                SUM(amount) AS total_ingresos,
                0 AS total_egresos
              FROM
                money_entries
              WHERE
                STRFTIME('%Y', DATE) = ?
              AND
                user_email = ?
              GROUP BY
                STRFTIME('%m', DATE)
              UNION ALL
              SELECT
                STRFTIME('%m', DATE) AS month,
                0 AS total_ingresos,
                SUM(amount) AS total_egresos
              FROM
                money_exits
              WHERE
                STRFTIME('%Y', DATE) = ?
              AND
                user_email = ?
              GROUP BY
                STRFTIME('%m', DATE)
            )
          GROUP BY
            month
          ORDER BY
            month`,
            args: [year, email, year, email]
        });
        await this.cacheManager.set(cacheKey, cashFlow.rows, { ttl: 60 * 1000 });
        return cashFlow.rows;
    }
    async getCategories({ email, year }) {
        const cacheKey = `categories_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const categories = await this.client.execute({
            sql: `SELECT category, SUM(amount) AS total
      FROM (
          SELECT category, amount, date
          FROM money_entries
          WHERE user_email = ? AND strftime("%Y", date) = ?
          UNION ALL
          SELECT category, amount AS amount, date
          FROM money_exits
          WHERE user_email = ? AND strftime("%Y", date) = ?
      ) AS combined
      GROUP BY category
      `,
            args: [email, year, email, year]
        });
        await this.cacheManager.set(cacheKey, categories.rows, { ttl: 60 * 1000 });
        return categories.rows;
    }
    async getRecentTransactions({ email, year }) {
        const cacheKey = `recentTransactions_${email}_${year}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const transactions = await this.client.execute({
            sql: `SELECT
            date,
            category,
            amount
          FROM
            (
              SELECT
                date,
                category,
                amount
              FROM
                money_entries
              WHERE
                user_email = ?
                AND STRFTIME('%Y', date) = ?
              ORDER BY
                entry_id DESC
              LIMIT
                4
            ) AS latest_entries
          UNION ALL
          SELECT
            date,
            category,
            amount
          FROM
            (
              SELECT
                category,
                amount,
                date
              FROM
                money_exits
              WHERE
                user_email = ?
                AND STRFTIME('%Y', date) = ?
              ORDER BY
                exit_id DESC
              LIMIT
                4
            ) AS latest_exits
          ORDER BY
            date DESC
          `,
            args: [email, year, email, year]
        });
        await this.cacheManager.set(cacheKey, transactions.rows, { ttl: 60 * 1000 });
        return transactions.rows;
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
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], SpecialsService);
//# sourceMappingURL=specials.service.js.map