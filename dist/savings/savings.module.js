"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsModule = void 0;
const common_1 = require("@nestjs/common");
const savings_service_1 = require("./savings.service");
const savings_controller_1 = require("./savings.controller");
const database_module_1 = require("../config/database.module");
const users_module_1 = require("../users/users.module");
let SavingsModule = class SavingsModule {
};
exports.SavingsModule = SavingsModule;
exports.SavingsModule = SavingsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, users_module_1.UsersModule],
        providers: [savings_service_1.SavingsService],
        controllers: [savings_controller_1.SavingsController]
    })
], SavingsModule);
//# sourceMappingURL=savings.module.js.map