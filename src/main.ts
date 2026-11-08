import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AllExceptionsFilter } from "@/middlewares/errors";
import { AppModule } from "./app.module";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const configService = app.get(ConfigService);

  // RESTful URL versioning / Global Prefix
  app.setGlobalPrefix("api/v1", {
    exclude: ["api", "api/docs", "api/docs/(.*)", "hello", "ping", "health"],
  });

  // Strict ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Centralized error filter with logging and Prisma error mapping
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Money Minder API")
    .setDescription("The Money Minder Financial REST API v1")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("money-minder")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // CORS configuration
  const corsOrigins = configService.get<string[]>("cors.origins") || [
    "http://localhost:4321",
    "http://localhost:4200",
    "http://localhost:3000",
    "https://money-minder-xi.vercel.app",
    "https://rosendo-garcia.vercel.app",
  ];

  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["set-auth-token"],
    optionsSuccessStatus: 204,
    credentials: true,
  });

  const port = configService.get<number>("nest.port") || 7373;
  await app.listen(port);
};

bootstrap();
