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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentTransactionsDto = exports.CategoriesDto = exports.CashFlowDto = exports.FinancialSummaryYearlyDto = exports.FinancialSummaryMonthlyDto = void 0;
const class_validator_1 = require("class-validator");
class FinancialSummaryMonthlyDto {
}
exports.FinancialSummaryMonthlyDto = FinancialSummaryMonthlyDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FinancialSummaryMonthlyDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}$/, {
        message: 'Year must be a valid year (e.g., 2023)'
    }),
    __metadata("design:type", String)
], FinancialSummaryMonthlyDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^(0[1-9]|1[0-2])$/, {
        message: 'Month must be a valid month (e.g., 01, 02, ..., 09, 10, 11, 12)'
    }),
    __metadata("design:type", String)
], FinancialSummaryMonthlyDto.prototype, "month", void 0);
class FinancialSummaryYearlyDto {
}
exports.FinancialSummaryYearlyDto = FinancialSummaryYearlyDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FinancialSummaryYearlyDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}$/, {
        message: 'Year must be a valid year (e.g., 2023)'
    }),
    __metadata("design:type", String)
], FinancialSummaryYearlyDto.prototype, "year", void 0);
class CashFlowDto {
}
exports.CashFlowDto = CashFlowDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CashFlowDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}$/, {
        message: 'Year must be a valid year (e.g., 2023)'
    }),
    __metadata("design:type", String)
], CashFlowDto.prototype, "year", void 0);
class CategoriesDto {
}
exports.CategoriesDto = CategoriesDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CategoriesDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}$/, {
        message: 'Year must be a valid year (e.g., 2023)'
    }),
    __metadata("design:type", String)
], CategoriesDto.prototype, "year", void 0);
class RecentTransactionsDto {
}
exports.RecentTransactionsDto = RecentTransactionsDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecentTransactionsDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\d{4}$/, {
        message: 'Year must be a valid year (e.g., 2023)'
    }),
    __metadata("design:type", String)
], RecentTransactionsDto.prototype, "year", void 0);
//# sourceMappingURL=specials.dto.js.map