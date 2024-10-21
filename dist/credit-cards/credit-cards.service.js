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
let CreditCardsService = class CreditCardsService {
    constructor(client, cacheManager) {
        this.client = client;
        this.cacheManager = cacheManager;
    }
    async newCreditCard({ email, name, cutOffDate, paymentDueDate }) {
        await this.client.execute({
            sql: 'INSERT INTO credit_cards (user_email, name, cut_off_date, payment_due_date) VALUES (?, ?, ?, ?)',
            args: [email, name, cutOffDate, paymentDueDate]
        });
        await this.cacheManager.del(`credit_cards_${email}`);
    }
    async getCreditCards({ email }) {
        const cacheKey = `credit_cards_${email}`;
        const cacheData = await this.cacheManager.get(cacheKey);
        if (cacheData)
            return cacheData;
        const creditCards = await this.client.execute({
            sql: 'SELECT credit_card_id, name, cut_off_date, payment_due_date FROM credit_cards WHERE user_email = ?',
            args: [email]
        });
        await this.cacheManager.set(cacheKey, creditCards.rows, { ttl: 60 * 1000 });
        return creditCards.rows;
    }
    async editCreditCard({ creditCardId, userEmail, name, cutOffDate, paymentDueDate }) {
        await this.client.execute({
            sql: 'UPDATE credit_cards SET name = ?, cut_off_date = ?, payment_due_date = ? WHERE credit_card_id = ? AND user_email = ?',
            args: [name, cutOffDate, paymentDueDate, creditCardId, userEmail]
        });
        await this.cacheManager.del(`credit_cards_${userEmail}`);
    }
    async deleteCreditCard({ creditCardId, userEmail }) {
        await this.client.execute({
            sql: 'DELETE FROM credit_cards WHERE credit_card_id = ? AND user_email = ?',
            args: [creditCardId, userEmail]
        });
        await this.cacheManager.del(`credit_cards_${userEmail}`);
    }
    async getDates({ creditCardId }) {
        return this.client.execute({
            sql: 'SELECT cut_off_date, payment_due_date FROM credit_cards WHERE credit_card_id = ?',
            args: [creditCardId]
        });
    }
    async getPurchasesRange({ creditCardId, cutOffDate, paymentDueDate }) {
        const purchases = await this.client.execute({
            sql: `
        SELECT 
          exit_id,
          amount,
          description,
          date,
          (SELECT SUM(amount) FROM money_exits WHERE credit_card_id = ? AND date BETWEEN ? AND ?) AS total_amount
        FROM 
          money_exits
        WHERE 
          credit_card_id = ?
        AND date BETWEEN ? AND ?
      `,
            args: [creditCardId, cutOffDate, paymentDueDate, creditCardId, cutOffDate, paymentDueDate]
        });
        return purchases.rows;
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
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], CreditCardsService);
//# sourceMappingURL=credit-cards.service.js.map