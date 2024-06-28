import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configure as serverlessExpress } from '@vendia/serverless-express'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { AllExceptionsFilter } from '@middlewares/errors'

const allowedOrigins = ['http://localhost:4321', 'https://money-minder-xi.vercel.app']

export const bootstrap = async (): Promise<NestExpressApplication> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Validation
  app.useGlobalPipes(new ValidationPipe())

  app.useGlobalFilters(new AllExceptionsFilter())

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    methods: 'GET, POST, PUT, DELETE, PATCH',
    credentials: true
  })

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
