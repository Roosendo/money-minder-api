import { AllExceptionsFilter } from '@/middlewares/errors'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  })

  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new AllExceptionsFilter())

  const config = new DocumentBuilder()
    .setTitle('Money Minder API')
    .setDescription('The Money Minder API')
    .setVersion('1.0')
    .addTag('money-minder')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

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
  })

  await app.listen(process.env.PORT || 7373)
}
bootstrap()
