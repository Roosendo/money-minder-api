"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansModule = void 0;
const database_module_1 = require("../config/database.module");
const users_module_1 = require("../users/users.module");
const common_1 = require("@nestjs/common");
const loans_controller_1 = require("./loans.controller");
const loans_service_1 = require("./loans.service");
let LoansModule = class LoansModule {
};
exports.LoansModule = LoansModule;
exports.LoansModule = LoansModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, users_module_1.UsersModule],
        controllers: [loans_controller_1.LoansController],
        providers: [loans_service_1.LoansService]
    })
], LoansModule);
//# sourceMappingURL=loans.module.js.map