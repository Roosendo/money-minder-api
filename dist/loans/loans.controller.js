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
exports.LoansController = void 0;
const errors_1 = require("../middlewares/errors");
const common_1 = require("@nestjs/common");
const loans_service_1 = require("./loans.service");
const users_service_1 = require("../users/users.service");
const loans_dto_1 = require("./loans.dto");
let LoansController = class LoansController {
    constructor(loansService, usersService) {
        this.loansService = loansService;
        this.usersService = usersService;
    }
    async newLoan(createLoanDto) {
        const createUserDto = {
            email: createLoanDto.userEmail,
            fullName: createLoanDto.fullName
        };
        await this.usersService.createUser(createUserDto);
        return this.loansService.newLoan(createLoanDto);
    }
    async getLoans(getLoansDto) {
        const loans = await this.loansService.getLoans(getLoansDto);
        return loans.map(loan => ({
            ...loan,
            last_five_payments: JSON.parse(loan.last_five_payments)
        }));
    }
    async editLoan(editLoanDto, loanId) {
        return this.loansService.editLoan({ ...editLoanDto, loanId });
    }
    async deleteLoan(deleteLoanDto, loanId) {
        return this.loansService.deleteLoan({ ...deleteLoanDto, loanId });
    }
    async addPayment(addPaymentDto) {
        return this.loansService.addPayment(addPaymentDto);
    }
    async editPayment(editPaymentDto) {
        return this.loansService.editPayment(editPaymentDto);
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Post)(''),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.CreateLoanDto]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "newLoan", null);
__decorate([
    (0, common_1.Get)(''),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.GetLoansDto]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "getLoans", null);
__decorate([
    (0, common_1.Patch)('/:loanId'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.CreateLoanDto, String]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "editLoan", null);
__decorate([
    (0, common_1.Delete)('/:loanId'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.DeleteLoansDto, String]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "deleteLoan", null);
__decorate([
    (0, common_1.Post)('/payments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.AddPaymentDTO]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Patch)('/payments/edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [loans_dto_1.EditPaymentDto]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "editPayment", null);
exports.LoansController = LoansController = __decorate([
    (0, common_1.Controller)('api/loans'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [loans_service_1.LoansService,
        users_service_1.UsersService])
], LoansController);
//# sourceMappingURL=loans.controller.js.map