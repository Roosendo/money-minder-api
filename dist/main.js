"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_nest_1 = require("./bootstrap.nest");
const config_1 = require("@nestjs/config");
const startServer = async () => {
    const app = await (0, bootstrap_nest_1.bootstrap)();
    console.log('Starting server...');
    const configService = app.get(config_1.ConfigService);
    const nestConfig = configService.get('nest');
    await app.listen(nestConfig.port);
};
startServer();
//# sourceMappingURL=main.js.map