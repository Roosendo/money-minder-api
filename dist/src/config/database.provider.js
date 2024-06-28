"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProviders = void 0;
const client_1 = require("@libsql/client");
const config_1 = require("@nestjs/config");
exports.databaseProviders = [
    {
        provide: 'DATABASE_CLIENT',
        useFactory: (configService) => {
            const client = (0, client_1.createClient)({
                url: configService.get('TURSO_DATABASE_URL') ?? '',
                authToken: configService.get('TURSO_AUTH_TOKEN') ?? ''
            });
            return client;
        },
        inject: [config_1.ConfigService]
    }
];
//# sourceMappingURL=database.provider.js.map