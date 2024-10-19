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
let LoansService = class LoansService {
    constructor(client, cacheManager) {
        this.client = client;
        this.cacheManager = cacheManager;
    }
    async newLoan({ userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid }) {
        await this.client.execute({
            sql: 'INSERT INTO loans (user_email, loan_title, bank_name, loan_date, interest_rate, monthly_payment, total_paid) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid]
        });
        await this.cacheManager.del(`loans_${userEmail}`);
    }
    async getLoans({ email }) {
        const cacheKey = `loans_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const loans = await this.client.execute({
            sql: 'SELECT loan_id, loan_title, bank_name, loan_date, interest_rate, monthly_payment, total_paid FROM loans WHERE user_email = ?',
            args: [email]
        });
        await this.cacheManager.set(cacheKey, loans.rows, { ttl: 60 * 1000 });
        return loans.rows;
    }
    async editLoan({ loanId, userEmail, loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid }) {
        await this.client.execute({
            sql: 'UPDATE loans SET loan_title = ?, bank_name = ?, loan_date = ?, interest_rate = ?, monthly_payment = ?, total_paid = ? WHERE loan_id = ? AND user_email = ?',
            args: [loanTitle, bankName, loanDate, interestRate, monthlyPayment, totalPaid, loanId, userEmail]
        });
        await this.cacheManager.del(`loans_${userEmail}`);
    }
    async deleteLoan({ loanId, userEmail }) {
        await this.client.execute({
            sql: 'DELETE FROM loans WHERE loan_id = ? AND user_email = ?',
            args: [loanId, userEmail]
        });
        await this.cacheManager.del(`loans_${userEmail}`);
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
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], LoansService);
//# sourceMappingURL=loans.service.js.map