import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '@/app.module'

const userEmail = process.env.TEST_EMAIL

describe('RemindersController (e2e)', () => {
  let app: INestApplication
  let reminderId: number

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

  it('/api/reminders/new-reminder (POST)', async () => {
    const newReminderDto = {
      email: userEmail,
      fullName: 'Luis Rog',
      title: 'Reminder test',
      reminderDate: '2024-06-29',
      description: ''
    }

    const reminder = await request(app.getHttpServer())
      .post('/api/reminders/new-reminder')
      .send(newReminderDto)
      .expect(201)

    expect(reminder.body).toHaveProperty('id')
    reminderId = reminder.body.id
  })

  it('/api/reminders/get-reminders (GET)', async () => {
    const email = userEmail

    const response = await request(app.getHttpServer())
      .get('/api/reminders/get-reminders')
      .query({ email })
      .expect(200)

    expect(response.body).toBeInstanceOf(Array)
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('title')
      expect(response.body[0]).toHaveProperty('description')
      expect(response.body[0]).toHaveProperty('reminder_date')
    }
  })

  it('/api/reminders/update-reminder (PATCH)', async () => {
    const newReminderDto = {
      email: userEmail,
      id: reminderId,
      newTitle: 'Reminder test updated',
      newDate: '2024-06-29',
      newDescription: ''
    }

    await request(app.getHttpServer())
      .patch('/api/reminders/update-reminder')
      .send(newReminderDto)
      .expect(200)
  })

  it('/api/reminders/delete-reminder (DELETE)', async () => {
    const email = userEmail

    await request(app.getHttpServer())
      .delete('/api/reminders/delete-reminder')
      .query({ email, id: reminderId })
      .expect(200)
  })
})
