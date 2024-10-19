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
exports.CreditCardsController = void 0;
const errors_1 = require("../middlewares/errors");
const common_1 = require("@nestjs/common");
const credit_cards_service_1 = require("./credit-cards.service");
const users_service_1 = require("../users/users.service");
const credit_cards_dto_1 = require("./credit-cards.dto");
let CreditCardsController = class CreditCardsController {
    constructor(creditCardsService, usersService) {
        this.creditCardsService = creditCardsService;
        this.usersService = usersService;
    }
    async newCreditCard(createCreditCardDto) {
        const createUserDto = {
            email: createCreditCardDto.email,
            fullName: createCreditCardDto.fullName
        };
        await this.usersService.createUser(createUserDto);
        return this.creditCardsService.newCreditCard(createCreditCardDto);
    }
    async getCreditCards(getCreditCardsDto) {
        const creditCards = await this.creditCardsService.getCreditCards(getCreditCardsDto);
        return creditCards;
    }
    async editCreditCard(editCreditCardDto, creditCardId) {
        return this.creditCardsService.editCreditCard({ ...editCreditCardDto, creditCardId });
    }
    async deleteCreditCard(deleteCreditCardDto, creditCardId) {
        return this.creditCardsService.deleteCreditCard({ ...deleteCreditCardDto, creditCardId });
    }
};
exports.CreditCardsController = CreditCardsController;
__decorate([
    (0, common_1.Post)(''),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_cards_dto_1.CreateCreditCardDto]),
    __metadata("design:returntype", Promise)
], CreditCardsController.prototype, "newCreditCard", null);
__decorate([
    (0, common_1.Get)(''),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_cards_dto_1.GetCreditCardsDto]),
    __metadata("design:returntype", Promise)
], CreditCardsController.prototype, "getCreditCards", null);
__decorate([
    (0, common_1.Put)('/:creditCardId'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('creditCardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_cards_dto_1.EditCreditCardDto, String]),
    __metadata("design:returntype", Promise)
], CreditCardsController.prototype, "editCreditCard", null);
__decorate([
    (0, common_1.Delete)('/:creditCardId'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('creditCardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_cards_dto_1.DeleteCreditCardDto, String]),
    __metadata("design:returntype", Promise)
], CreditCardsController.prototype, "deleteCreditCard", null);
exports.CreditCardsController = CreditCardsController = __decorate([
    (0, common_1.Controller)('api/credit-cards'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __metadata("design:paramtypes", [credit_cards_service_1.CreditCardsService,
        users_service_1.UsersService])
], CreditCardsController);
//# sourceMappingURL=credit-cards.controller.js.map