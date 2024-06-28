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
exports.ExitController = void 0;
const common_1 = require("@nestjs/common");
const exits_service_1 = require("./exits.service");
const exits_dto_1 = require("./exits.dto");
const users_service_1 = require("../users/users.service");
const errors_1 = require("../middlewares/errors");
let ExitController = class ExitController {
    constructor(exitService, usersService) {
        this.exitService = exitService;
        this.usersService = usersService;
    }
    async newExpense(createExpenseDto) {
        const createUserDto = { email: createExpenseDto.email, fullName: createExpenseDto.fullName };
        await this.usersService.createUser(createUserDto);
        return this.exitService.newExpense(createExpenseDto);
    }
    async getExits(getExitsDto) {
        const exits = await this.exitService.getExits(getExitsDto);
        return exits;
    }
    async getExpensesByCategoryMonthly(monthlyExitDto) {
        const exits = await this.exitService.getExpensesByCategoryMonthly(monthlyExitDto);
        return exits;
    }
};
exports.ExitController = ExitController;
__decorate([
    (0, common_1.Post)('new-exit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.CreateExpenseDto]),
    __metadata("design:returntype", Promise)
], ExitController.prototype, "newExpense", null);
__decorate([
    (0, common_1.Get)('get-exits'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.GetExitsDto]),
    __metadata("design:returntype", Promise)
], ExitController.prototype, "getExits", null);
__decorate([
    (0, common_1.Get)('get-exits-by-category-monthly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exits_dto_1.MonthlyExitDto]),
    __metadata("design:returntype", Promise)
], ExitController.prototype, "getExpensesByCategoryMonthly", null);
exports.ExitController = ExitController = __decorate([
    (0, common_1.Controller)('api/exits'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [exits_service_1.ExitService,
        users_service_1.UsersService])
], ExitController);
//# sourceMappingURL=exits.controller.js.map