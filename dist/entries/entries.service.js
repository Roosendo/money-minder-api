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
exports.EntryService = void 0;
const common_1 = require("@nestjs/common");
let EntryService = class EntryService {
    constructor(client) {
        this.client = client;
    }
    async newEntry({ email, date, amount, category, description }) {
        await this.client.execute({
            sql: 'INSERT INTO money_entries (user_email, DATE, amount, category, description) VALUES (?, ?, ?, ?, ?)',
            args: [email, date, amount, category, description]
        });
    }
    async getEntries({ email }) {
        const entries = await this.client.execute({
            sql: 'SELECT amount, description, category, DATE, entry_id FROM money_entries WHERE user_email = ? ORDER BY entry_id DESC LIMIT 15',
            args: [email]
        });
        return entries.rows;
    }
    async getEntriesByCategoryMonthly({ email, month, year }) {
        const entries = await this.client.execute({
            sql: 'SELECT category, SUM(amount) AS total FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ? GROUP BY category',
            args: [email, month, year]
        });
        return entries.rows;
    }
    async getMonthlySummary({ email, month, year }) {
        const entries = await this.client.execute({
            sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%m", date) = ? AND strftime("%Y", date) = ?',
            args: [email, month, year]
        });
        return entries.rows;
    }
    async getYearlySummary({ email, year }) {
        const entries = await this.client.execute({
            sql: 'SELECT SUM(amount) AS totalEntries FROM money_entries WHERE user_email = ? AND strftime("%Y", date) = ?',
            args: [email, year]
        });
        return entries.rows;
    }
};
exports.EntryService = EntryService;
exports.EntryService = EntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DATABASE_CLIENT')),
    __metadata("design:paramtypes", [Object])
], EntryService);
//# sourceMappingURL=entries.service.js.map