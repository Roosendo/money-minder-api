"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("./middlewares/errors");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose']
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.useGlobalFilters(new errors_1.AllExceptionsFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Money Minder API')
        .setDescription('The Money Minder API')
        .setVersion('1.0')
        .addTag('money-minder')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    app.enableCors({
        origin: [
            'http://localhost:4321',
            'http://localhost:4200',
            'https://money-minder-xi.vercel.app',
            'https://money-minder-xi.vercel.app/*',
            'https://rosendo-garcia.vercel.app',
            'https://rosendo-garcia.vercel.app/*',
            'https://9000-idx-money-minder-1728752434449.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev'
        ],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 204,
        credentials: true
    });
    await app.listen(process.env.PORT || 7373);
};
bootstrap();
//# sourceMappingURL=main.js.map