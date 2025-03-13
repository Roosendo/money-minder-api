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
exports.LoansService = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
const loans_dto_1 = require("./loans.dto");
const prisma_service_1 = require("../prisma.service");
const loans_utils_1 = require("./loans.utils");
let LoansService = class LoansService {
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async newLoan({ userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }) {
        const newLoanId = await this.prisma.loans.create({
            data: {
                user_email: userEmail,
                loan_title: loanTitle,
                bank_name: bankName,
                interest_rate: interestRate,
                loan_amount: loanAmount,
                loan_start_date: new Date(loanStartDate),
                loan_end_date: new Date(loanEndDate)
            },
            select: { id: true }
        });
        await this.cacheManager.del(`loans_${userEmail}`);
        return { id: newLoanId.id };
    }
    async getLoans({ email }) {
        const cacheKey = `loans_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const loans = await (0, loans_utils_1.getLoanDetails)(email);
        await this.cacheManager.set(cacheKey, loans, 60 * 1000);
        return loans;
    }
    async editLoan({ loanId, userEmail, loanTitle, bankName, interestRate, loanAmount, loanStartDate, loanEndDate }) {
        await this.prisma.loans.update({
            where: { id: +loanId, user_email: userEmail },
            data: {
                loan_title: loanTitle,
                bank_name: bankName,
                interest_rate: interestRate,
                loan_amount: loanAmount,
                loan_start_date: new Date(loanStartDate),
                loan_end_date: new Date(loanEndDate)
            }
        });
        await this.cacheManager.del(`loans_${userEmail}`);
    }
    async deleteLoan({ loanId, userEmail }) {
        await this.prisma.loans.delete({
            where: { id: +loanId, user_email: userEmail }
        });
        await this.cacheManager.del(`loans_${userEmail}`);
    }
    async addPayment({ loanId, paymentDate, paymentAmount }) {
        return await this.prisma.payments.create({
            data: {
                loan_id: loanId,
                payment_date: new Date(paymentDate),
                payment_amount: paymentAmount
            },
            select: { id: true }
        });
    }
    async editPayment({ paymentId, paymentDate, paymentAmount, email }) {
        await this.prisma.payments.update({
            where: { id: +paymentId },
            data: {
                payment_date: new Date(paymentDate),
                payment_amount: paymentAmount
            }
        });
        await this.cacheManager.del(`loans_${email}`);
    }
    async deletePayment({ paymentId, email }) {
        await this.prisma.payments.delete({
            where: { id: +paymentId }
        });
        await this.cacheManager.del(`loans_${email}`);
    }
};
exports.LoansService = LoansService;
__decorate([
    (0, cache_manager_1.CacheKey)('loans'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.GetLoansDto]),
    __metadata("design:returntype", Promise)
], LoansService.prototype, "getLoans", null);
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_manager_1.Cache])
], LoansService);
//# sourceMappingURL=loans.service.js.map