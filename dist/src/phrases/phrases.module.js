"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhrasesModule = void 0;
const common_1 = require("@nestjs/common");
const phrases_controller_1 = require("./phrases.controller");
const phrases_service_1 = require("./phrases.service");
let PhrasesModule = class PhrasesModule {
};
exports.PhrasesModule = PhrasesModule;
exports.PhrasesModule = PhrasesModule = __decorate([
    (0, common_1.Module)({
        controllers: [phrases_controller_1.PhrasesController],
        providers: [phrases_service_1.PhrasesService]
    })
], PhrasesModule);
//# sourceMappingURL=phrases.module.js.map