"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    nest: {
        port: +(process.env.PORT || '7373')
    },
    cors: {
        enabled: true
    }
};
exports.default = () => config;
//# sourceMappingURL=config.js.map