import { AllExceptionsFilter } from '@middlewares/errors'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)

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
      'https://money-minder-xi.vercel.app',
      'https://money-minder-xi.vercel.app/*'
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
    credentials: true
  })

  await app.listen(process.env.PORT || 7373)
}
bootstrap()
