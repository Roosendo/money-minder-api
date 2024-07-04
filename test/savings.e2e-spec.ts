import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '@/app.module'

const userEmail = process.env.TEST_EMAIL

describe('SavingsController (e2e)', () => {
  let app: INestApplication
  let savingId: number

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
      sql: 'DELETE FROM reminders WHERE user_email = ?',
      args: [userEmail]
    })
  })

  afterEach(async () => {
    await app.get('DATABASE_CLIENT').execute({
      sql: 'DELETE FROM reminders WHERE user_email = ?',
      args: [userEmail]
    })
  })

  it('/api/savings/new-saving (POST)', async () => {
    const newSavingDto = {
      email: userEmail,
      fullName: 'Luis Rog',
      name: 'Saving test',
      startDate: '2024-06-19T19:07:00',
      endDate: '2024-06-29T19:07:00',
      targetAmount: 1000,
      currentAmount: 0
    }

    const saving = await request(app.getHttpServer())
      .post('/api/savings/new-saving')
      .send(newSavingDto)
      .expect(201)

    expect(saving.body).toHaveProperty('id')
    savingId = saving.body.id
  })

  it('/api/savings/get-savings (GET)', async () => {
    const savings = await request(app.getHttpServer())
      .get('/api/savings/get-savings')
      .query({ email: userEmail })
      .expect(200)

    expect(savings.body[0]).toHaveProperty('current_amount')
    expect(savings.body[0]).toHaveProperty('end_date')
    expect(savings.body[0]).toHaveProperty('name')
    expect(savings.body[0]).toHaveProperty('target_amount')
    expect(savings.body[0]).toHaveProperty('id')
  })

  it('/api/savings/update-saving (PATCH)', async () => {
    const newSavingDto = {
      id: savingId,
      email: userEmail,
      newSavingName: 'Saving test',
      startDate: '2024-06-19T19:07:00',
      newEndDate: '2024-06-29T19:07:00',
      newTarget: 1200,
      newCurrentAmount: 600
    }

    await request(app.getHttpServer())
      .patch('/api/savings/update-saving')
      .send(newSavingDto)
      .expect(200)
  })

  it('/api/savings/delete-saving (DELETE)', async () => {
    await request(app.getHttpServer())
      .delete('/api/savings/delete-saving')
      .query({ id: savingId, email: userEmail })
      .expect(200)
  })
})
