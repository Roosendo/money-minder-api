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
exports.PhrasesController = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const phrases_service_1 = require("./phrases.service");
const errors_1 = require("../middlewares/errors");
let PhrasesController = class PhrasesController {
    constructor(phrasesService, cacheManager) {
        this.phrasesService = phrasesService;
        this.cacheManager = cacheManager;
    }
    async getPhrases() {
        const today = new Date();
        const cacheKey = `daily_phrase_${today.getDate()}`;
        const cachedPhrase = await this.cacheManager.get(cacheKey);
        if (cachedPhrase)
            return cachedPhrase;
        const phrases = await this.phrasesService.getPhrases();
        const index = today.getDate() % phrases.length;
        const dailyPhrase = phrases[index];
        await this.cacheManager.set(cacheKey, dailyPhrase, 24 * 60 * 60 * 1000);
        return dailyPhrase;
    }
};
exports.PhrasesController = PhrasesController;
__decorate([
    (0, common_1.Get)('daily-phrase'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PhrasesController.prototype, "getPhrases", null);
exports.PhrasesController = PhrasesController = __decorate([
    (0, common_1.Controller)('api/phrases'),
    (0, common_1.UseFilters)(errors_1.AllExceptionsFilter),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [phrases_service_1.PhrasesService,
        cache_manager_1.Cache])
], PhrasesController);
//# sourceMappingURL=phrases.controller.js.map