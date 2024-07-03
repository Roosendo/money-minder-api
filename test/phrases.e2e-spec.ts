import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '@/app.module'

describe('PhraseController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('/api/phrases/daily-phrase (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/phrases/daily-phrase').expect(200)

    expect(response.body).toHaveProperty('character')
    expect(response.body).toHaveProperty('movie')
    expect(response.body).toHaveProperty('phrase')
  })
})
