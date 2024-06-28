"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapServerless = exports.bootstrap = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const serverless_express_1 = require("@vendia/serverless-express");
const common_1 = require("@nestjs/common");
const errors_1 = require("./middlewares/errors");
const allowedOrigins = ['http://localhost:4321', 'https://money-minder-xi.vercel.app'];
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.useGlobalFilters(new errors_1.AllExceptionsFilter());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
        methods: 'GET, POST, PUT, DELETE, PATCH',
        credentials: true
    });
    return app;
};
exports.bootstrap = bootstrap;
const bootstrapServerless = async () => {
    const app = await (0, exports.bootstrap)();
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    return (0, serverless_express_1.configure)({ app: expressApp });
};
exports.bootstrapServerless = bootstrapServerless;
//# sourceMappingURL=bootstrap.nest.js.map