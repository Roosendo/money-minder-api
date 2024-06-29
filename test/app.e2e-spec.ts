import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '@/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/api/hello (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/hello')
      .expect(200)
      .expect('Hi there you fantastic person!')
  })

  it('/api/ping (GET)', () => {
    return request(app.getHttpServer()).get('/api/ping').expect(200).expect('pong 🎾')
  })

  it('/api/phrases/daily-phrase (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/phrases/daily-phrase').expect(200)

    expect(response.body).toHaveProperty('phrase')
    expect(response.body).toHaveProperty('movie')
    expect(response.body).toHaveProperty('character')
  })
})
