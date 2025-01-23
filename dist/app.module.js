"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_2 = require("./common/configs/config");
const savings_module_1 = require("./savings/savings.module");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("./prisma.service");
const core_1 = require("@nestjs/core");
const big_int_interceptor_1 = require("./big-int-interceptor");
const entries_module_1 = require("./entries/entries.module");
const exits_module_1 = require("./exits/exits.module");
const phrases_module_1 = require("./phrases/phrases.module");
const reminders_module_1 = require("./reminders/reminders.module");
const auth_module_1 = require("./auth/auth.module");
const email_module_1 = require("./email/email.module");
const specials_module_1 = require("./specials/specials.module");
const credit_cards_module_1 = require("./credit-cards/credit-cards.module");
const loans_module_1 = require("./loans/loans.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.default]
            }),
            entries_module_1.EntryModule,
            exits_module_1.ExitModule,
            phrases_module_1.PhrasesModule,
            reminders_module_1.RemindersModule,
            savings_module_1.SavingsModule,
            specials_module_1.SpecialsModule,
            auth_module_1.AuthModule,
            email_module_1.EmailModule,
            credit_cards_module_1.CreditCardsModule,
            loans_module_1.LoansModule,
            cache_manager_1.CacheModule.register({
                ttl: 60 * 1000,
                max: 100,
                isGlobal: true
            })
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, prisma_service_1.PrismaService, {
                provide: core_1.APP_INTERCEPTOR,
                useClass: big_int_interceptor_1.BigIntInterceptor
            }],
        exports: [prisma_service_1.PrismaService]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map