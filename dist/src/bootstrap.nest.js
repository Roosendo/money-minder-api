"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapServerless = exports.bootstrap = void 0;
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const serverless_express_1 = require("@vendia/serverless-express");
const common_1 = require("@nestjs/common");
const errors_1 = require("./middlewares/errors");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.useGlobalFilters(new errors_1.AllExceptionsFilter());
    const configService = app.get(config_1.ConfigService);
    const corsConfig = configService.get('cors');
    const swaggerConfig = configService.get('swagger');
    if (swaggerConfig.enabled) {
        const options = new swagger_1.DocumentBuilder()
            .setTitle(swaggerConfig.title || 'Money Minder API')
            .setDescription(swaggerConfig.description)
            .setVersion(swaggerConfig.version)
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, options);
        console.log('env?', process.env.NODE_ENV);
        if (process.env.NODE_ENV !== 'production') {
            fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2));
        }
        swagger_1.SwaggerModule.setup(swaggerConfig.path || 'api', app, document);
    }
    if (corsConfig.enabled) {
        app.enableCors({
            origin: corsConfig.allowedOrigins,
            methods: ['GET', 'POST', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization']
        });
    }
    return app;
};
exports.bootstrap = bootstrap;
const bootstrapServerless = async () => {
    const app = await (0, exports.bootstrap)();
    const globalPrefix = '.netlify/functions/api';
    app.setGlobalPrefix(globalPrefix);
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    return (0, serverless_express_1.configure)({ app: expressApp });
};
exports.bootstrapServerless = bootstrapServerless;
//# sourceMappingURL=bootstrap.nest.js.map