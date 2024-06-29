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
exports.EntryController = void 0;
const common_1 = require("@nestjs/common");
const entries_service_1 = require("./entries.service");
const entries_dto_1 = require("./entries.dto");
const users_service_1 = require("../users/users.service");
const errors_1 = require("../middlewares/errors");
let EntryController = class EntryController {
    constructor(entryService, usersService) {
        this.entryService = entryService;
        this.usersService = usersService;
    }
    async newEntry(createEntryDto) {
        const createUserDto = {
            email: createEntryDto.email,
            fullName: createEntryDto.fullName
        };
        await this.usersService.createUser(createUserDto);
        return this.entryService.newEntry(createEntryDto);
    }
    async getEntries(getEntriesDto) {
        const entries = await this.entryService.getEntries(getEntriesDto);
        return entries;
    }
    async getEntriesByCategoryMonthly(monthlyEntryDto) {
        const entries = await this.entryService.getEntriesByCategoryMonthly(monthlyEntryDto);
        return entries;
    }
};
exports.EntryController = EntryController;
__decorate([
    (0, common_1.Post)('new-entry'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.CreateEntryDto]),
    __metadata("design:returntype", Promise)
], EntryController.prototype, "newEntry", null);
__decorate([
    (0, common_1.Get)('get-entries'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.GetEntriesDto]),
    __metadata("design:returntype", Promise)
], EntryController.prototype, "getEntries", null);
__decorate([
    (0, common_1.Get)('get-entries-by-category-monthly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entries_dto_1.MonthlyEntryDto]),
    __metadata("design:returntype", Promise)
], EntryController.prototype, "getEntriesByCategoryMonthly", null);
exports.EntryController = EntryController = __decorate([
    (0, common_1.Controller)('api/entries'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [entries_service_1.EntryService,
        users_service_1.UsersService])
], EntryController);
//# sourceMappingURL=entries.controller.js.map