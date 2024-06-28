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
exports.SavingsController = void 0;
const common_1 = require("@nestjs/common");
const savings_service_1 = require("./savings.service");
const savings_dto_1 = require("./savings.dto");
const users_service_1 = require("../users/users.service");
const errors_1 = require("../middlewares/errors");
let SavingsController = class SavingsController {
    constructor(savingsService, usersService) {
        this.savingsService = savingsService;
        this.usersService = usersService;
    }
    async newSaving(createSavingDto) {
        const createUserDto = { email: createSavingDto.email, fullName: createSavingDto.fullName };
        await this.usersService.createUser(createUserDto);
        return this.savingsService.newSaving(createSavingDto);
    }
    async getSavings(getSavingsDto) {
        const savings = await this.savingsService.getSavings(getSavingsDto);
        return savings;
    }
    async deleteSaving(deleteSavingDto) {
        return this.savingsService.deleteSaving(deleteSavingDto);
    }
    async updateSaving(updateSavingDto) {
        return this.savingsService.updateSaving(updateSavingDto);
    }
};
exports.SavingsController = SavingsController;
__decorate([
    (0, common_1.Post)('new-saving'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [savings_dto_1.CreateSavingDto]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "newSaving", null);
__decorate([
    (0, common_1.Get)('get-savings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [savings_dto_1.GetSavingsDto]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "getSavings", null);
__decorate([
    (0, common_1.Delete)('delete-saving'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [savings_dto_1.DeleteSavingDto]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "deleteSaving", null);
__decorate([
    (0, common_1.Patch)('update-saving'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [savings_dto_1.UpdateSavingDto]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "updateSaving", null);
exports.SavingsController = SavingsController = __decorate([
    (0, common_1.Controller)('api/savings'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [savings_service_1.SavingsService,
        users_service_1.UsersService])
], SavingsController);
//# sourceMappingURL=savings.controller.js.map