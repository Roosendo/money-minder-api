import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import type {
  CorsConfig,
  SwaggerConfig
} from '@/common/configs/config.interface'
import { configure as serverlessExpress } from '@vendia/serverless-express'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { AllExceptionsFilter } from '@middlewares/errors'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'

export const bootstrap = async (): Promise<NestExpressApplication> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Validation
  app.useGlobalPipes(new ValidationPipe())

  app.useGlobalFilters(new AllExceptionsFilter())

  const configService = app.get(ConfigService)
  const corsConfig = configService.get<CorsConfig>('cors')
  const swaggerConfig = configService.get<SwaggerConfig>('swagger')

  if (swaggerConfig.enabled) {
    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'Money Minder API')
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .build()

    const document = SwaggerModule.createDocument(app, options)
    console.log('env?', process.env.NODE_ENV)
    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2))
    }

    SwaggerModule.setup(swaggerConfig.path || 'api', app, document)
  }

  if (corsConfig.enabled) {
    app.enableCors({
      origin: corsConfig.allowedOrigins
    })
  }

  return app
}

export const bootstrapServerless = async () => {
  const app = await bootstrap()
  const globalPrefix = '.netlify/functions/api'
  app.setGlobalPrefix(globalPrefix)

  await app.init()
  const expressApp = app.getHttpAdapter().getInstance()
  return serverlessExpress({ app: expressApp })
}
