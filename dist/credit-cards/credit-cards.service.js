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
exports.CreditCardsService = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
const credit_cards_dto_1 = require("./credit-cards.dto");
const prisma_service_1 = require("../prisma.service");
let CreditCardsService = class CreditCardsService {
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async newCreditCard({ email, name, cutOffDate, paymentDueDate }) {
        await this.prisma.credit_cards.create({
            data: {
                user_email: email,
                name,
                cut_off_date: +cutOffDate,
                payment_due_date: +paymentDueDate
            },
            select: { credit_card_id: true }
        });
        await this.cacheManager.del(`credit_cards_${email}`);
    }
    async getCreditCards({ email }) {
        const cacheKey = `credit_cards_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const creditCards = await this.prisma.credit_cards.findMany({
            where: { user_email: email },
            select: { credit_card_id: true, name: true, cut_off_date: true, payment_due_date: true }
        });
        await this.cacheManager.set(cacheKey, creditCards, { ttl: 60 * 1000 });
        return creditCards;
    }
    async editCreditCard({ creditCardId, userEmail, name, cutOffDate, paymentDueDate }) {
        await this.prisma.credit_cards.update({
            where: { credit_card_id: +creditCardId, user_email: userEmail },
            data: { name, cut_off_date: +cutOffDate, payment_due_date: +paymentDueDate }
        });
        await this.cacheManager.del(`credit_cards_${userEmail}`);
    }
    async deleteCreditCard({ creditCardId, userEmail }) {
        await this.prisma.credit_cards.delete({
            where: { credit_card_id: +creditCardId, user_email: userEmail }
        });
        await this.cacheManager.del(`credit_cards_${userEmail}`);
    }
    async getPurchasesRange({ email }) {
        const now = new Date();
        const currentDay = now.getDate();
        const creditCards = await this.prisma.credit_cards.findMany({
            where: {
                user_email: email
            },
            select: {
                credit_card_id: true,
                name: true,
                cut_off_date: true,
            }
        });
        const cardsWithDates = creditCards.map(card => {
            const cutOffDate = card.cut_off_date;
            let endCutOffDate;
            let startCutOffDate;
            if (currentDay > cutOffDate) {
                endCutOffDate = new Date(now.getFullYear(), now.getMonth(), cutOffDate);
                startCutOffDate = new Date(now.getFullYear(), now.getMonth() - 1, cutOffDate + 1);
            }
            else {
                endCutOffDate = new Date(now.getFullYear(), now.getMonth() - 1, cutOffDate);
                startCutOffDate = new Date(now.getFullYear(), now.getMonth() - 2, cutOffDate + 1);
            }
            return {
                ...card,
                start_cut_off_date: startCutOffDate,
                end_cut_off_date: endCutOffDate
            };
        });
        const result = await Promise.all(cardsWithDates.map(async (card) => {
            const exits = await this.prisma.money_exits.findMany({
                where: {
                    credit_card_id: card.credit_card_id,
                    date: {
                        gte: card.start_cut_off_date,
                        lte: card.end_cut_off_date
                    }
                },
                select: {
                    exit_id: true,
                    amount: true,
                    description: true,
                    date: true
                }
            });
            const total_amount = exits.reduce((sum, exit) => sum + (+exit.amount || 0), 0);
            return {
                ...card,
                exits,
                total_amount
            };
        }));
        return result;
    }
};
exports.CreditCardsService = CreditCardsService;
__decorate([
    (0, cache_manager_1.CacheKey)('credit_cards'),
    (0, cache_manager_1.CacheTTL)(60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_cards_dto_1.GetCreditCardsDto]),
    __metadata("design:returntype", Promise)
], CreditCardsService.prototype, "getCreditCards", null);
exports.CreditCardsService = CreditCardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], CreditCardsService);
//# sourceMappingURL=credit-cards.service.js.map