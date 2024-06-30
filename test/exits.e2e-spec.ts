import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '@/app.module'

const userEmail = process.env.TEST_EMAIL

describe('ExitController (e2e)', () => {
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

  beforeEach(async () => {
    await app.get('DATABASE_CLIENT').execute({
      sql: 'DELETE FROM money_exits WHERE user_email = ?',
      args: [userEmail]
    })
  })

  afterEach(async () => {
    await app.get('DATABASE_CLIENT').execute({
      sql: 'DELETE FROM money_exits WHERE user_email = ?',
      args: [userEmail]
    })
  })

  it('/api/exits/new-exit (POST)', async () => {
    const newExitDto = {
      email: userEmail,
      fullName: 'Luis Rog',
      date: '2024-06-29',
      amount: 100,
      category: 'Test Category',
      description: 'Test Description'
    }

    await request(app.getHttpServer()).post('/api/exits/new-exit').send(newExitDto).expect(201)
  })

  it('/api/exits/get-exits (GET)', async () => {
    const email = userEmail

    const response = await request(app.getHttpServer())
      .get('/api/exits/get-exits')
      .query({ email })
      .expect(200)

    expect(response.body).toBeInstanceOf(Array)
    if (response.body.length > 0) {
      expect(response.body[0].email).toHaveProperty('amount')
      expect(response.body[0]).toHaveProperty('description')
      expect(response.body[0]).toHaveProperty('category')
      expect(response.body[0]).toHaveProperty('date')
    }
  })

  it('/api/exits/get-exits-by-category-monthly (GET)', async () => {
    const query = {
      email: userEmail,
      month: 6,
      year: 2024
    }

    const response = await request(app.getHttpServer())
      .get('/api/exits/get-exits-by-category-monthly')
      .query(query)
      .expect(200)

    expect(response.body).toBeInstanceOf(Array)
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('category')
      expect(response.body[0]).toHaveProperty('total')
    }
  })
})
