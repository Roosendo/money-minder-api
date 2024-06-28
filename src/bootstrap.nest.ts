import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configure as serverlessExpress } from '@vendia/serverless-express'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { AllExceptionsFilter } from '@middlewares/errors'

export const bootstrap = async (): Promise<NestExpressApplication> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Validation
  app.useGlobalPipes(new ValidationPipe())

  app.useGlobalFilters(new AllExceptionsFilter())

  return app
}

export const bootstrapServerless = async () => {
  const app = await bootstrap()
  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)

  await app.init()
  const expressApp = app.getHttpAdapter().getInstance()
  return serverlessExpress({ app: expressApp })
}
