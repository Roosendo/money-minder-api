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
const entries_module_1 = require("./entries/entries.module");
const exits_module_1 = require("./exits/exits.module");
const database_module_1 = require("./config/database.module");
const config_2 = require("./common/configs/config");
const phrases_module_1 = require("./phrases/phrases.module");
const reminders_module_1 = require("./reminders/reminders.module");
const savings_module_1 = require("./savings/savings.module");
const specials_module_1 = require("./specials/specials.module");
const auth_module_1 = require("./auth/auth.module");
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
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map