"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigIntInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let BigIntInterceptor = class BigIntInterceptor {
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => this.handleBigInt(data)));
    }
    handleBigInt(value) {
        if (value === null || value === undefined)
            return value;
        if (typeof value === 'bigint') {
            return Number(value);
        }
        if (value instanceof Date) {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.handleBigInt(item));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, this.handleBigInt(val)]));
        }
        return value;
    }
};
exports.BigIntInterceptor = BigIntInterceptor;
exports.BigIntInterceptor = BigIntInterceptor = __decorate([
    (0, common_1.Injectable)()
], BigIntInterceptor);
//# sourceMappingURL=big-int-interceptor.interceptor.js.map