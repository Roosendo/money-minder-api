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
exports.SpecialsController = void 0;
const common_1 = require("@nestjs/common");
const specials_service_1 = require("./specials.service");
const entries_service_1 = require("../entries/entries.service");
const exits_service_1 = require("../exits/exits.service");
const specials_dto_1 = require("./specials.dto");
const errors_1 = require("../middlewares/errors");
let SpecialsController = class SpecialsController {
    constructor(specialsService, entryService, exitService) {
        this.specialsService = specialsService;
        this.entryService = entryService;
        this.exitService = exitService;
    }
    async getFinancialSummaryYearly(financialSummaryYearlyDto) {
        const entries = await this.entryService.getYearlySummary(financialSummaryYearlyDto);
        const exits = await this.exitService.getYearlySummary(financialSummaryYearlyDto);
        const totalEntries = entries[0]?.totalEntries || 0;
        const totalExits = exits[0]?.totalExits || 0;
        return { totalEntries, totalExits };
    }
    async getFinancialSummaryMonthly(financialSummaryMonthlyDto) {
        const entries = await this.entryService.getMonthlySummary(financialSummaryMonthlyDto);
        const exits = await this.exitService.getMonthlySummary(financialSummaryMonthlyDto);
        const totalEntries = entries[0]?.totalEntries || 0;
        const totalExits = exits[0]?.totalExits || 0;
        return { totalEntries, totalExits };
    }
    async getCashFlow(cashFlowDto) {
        return this.specialsService.getCashFlow(cashFlowDto);
    }
    async getCategories(categoriesDto) {
        return this.specialsService.getCategories(categoriesDto);
    }
    async getRecentTransactions(recentTransactionsDto) {
        return this.specialsService.getRecentTransactions(recentTransactionsDto);
    }
};
exports.SpecialsController = SpecialsController;
__decorate([
    (0, common_1.Get)('financial-summary-yearly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.FinancialSummaryYearlyDto]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "getFinancialSummaryYearly", null);
__decorate([
    (0, common_1.Get)('financial-summary-monthly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.FinancialSummaryMonthlyDto]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "getFinancialSummaryMonthly", null);
__decorate([
    (0, common_1.Get)('cash-flow'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.CashFlowDto]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "getCashFlow", null);
__decorate([
    (0, common_1.Get)('yearly-categories'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.CategoriesDto]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('recent-transactions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [specials_dto_1.RecentTransactionsDto]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "getRecentTransactions", null);
exports.SpecialsController = SpecialsController = __decorate([
    (0, common_1.Controller)('api/specials'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [specials_service_1.SpecialsService,
        entries_service_1.EntryService,
        exits_service_1.ExitService])
], SpecialsController);
//# sourceMappingURL=specials.controller.js.map