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
exports.SavingsService = void 0;
const common_1 = require("@nestjs/common");
let SavingsService = class SavingsService {
    constructor(client) {
        this.client = client;
    }
    async newSaving({ email, name, targetAmount, currentAmount, startDate, endDate }) {
        const saving = await this.client.execute({
            sql: 'INSERT INTO savings_goals (user_email, name, target_amount, current_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
            args: [email, name, targetAmount, currentAmount, startDate, endDate]
        });
        const id = saving.rows[0]?.id;
        return { id };
    }
    async getSavings({ email }) {
        const savings = await this.client.execute({
            sql: 'SELECT id, name, target_amount, current_amount, end_date FROM savings_goals WHERE user_email = ?',
            args: [email]
        });
        return savings.rows;
    }
    async deleteSaving({ email, id }) {
        await this.client.execute({
            sql: 'DELETE FROM savings_goals WHERE user_email = ? AND id = ?',
            args: [email, id]
        });
    }
    async updateSaving({ email, id, newSavingName, newTarget, newCurrentAmount, newEndDate }) {
        await this.client.execute({
            sql: 'UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, end_date = ? WHERE user_email = ? AND id = ?',
            args: [newSavingName, newTarget, newCurrentAmount, newEndDate, email, id]
        });
    }
};
exports.SavingsService = SavingsService;
exports.SavingsService = SavingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __metadata("design:paramtypes", [Object])
], SavingsService);
//# sourceMappingURL=savings.service.js.map