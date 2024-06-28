"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    nest: {
        port: +(process.env.PORT || '7373')
    },
    cors: {
        enabled: true,
        allowedOrigins: ['http://localhost:4321', 'https://money-minder-xi.vercel.app']
    },
    swagger: {
        enabled: true,
        title: 'Money Minder Api',
        description: '',
        version: '1.0',
        path: ''
    }
};
exports.default = () => config;
//# sourceMappingURL=config.js.map