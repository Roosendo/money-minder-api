"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialsModule = void 0;
const common_1 = require("@nestjs/common");
const specials_service_1 = require("./specials.service");
const entries_service_1 = require("../entries/entries.service");
const exits_service_1 = require("../exits/exits.service");
const specials_controller_1 = require("./specials.controller");
const prisma_service_1 = require("../prisma.service");
let SpecialsModule = class SpecialsModule {
};
exports.SpecialsModule = SpecialsModule;
exports.SpecialsModule = SpecialsModule = __decorate([
    (0, common_1.Module)({
        providers: [specials_service_1.SpecialsService, entries_service_1.EntryService, exits_service_1.ExitService, prisma_service_1.PrismaService],
        controllers: [specials_controller_1.SpecialsController]
    })
], SpecialsModule);
//# sourceMappingURL=specials.module.js.map