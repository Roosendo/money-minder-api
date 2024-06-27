import { Inject, Injectable } from '@nestjs/common'
import { CreateUserDto } from './users.dto'
import { Client } from '@libsql/client/.'

@Injectable()
export class UsersService {
  constructor (@Inject('DATABASE_CLIENT') private readonly client: Client) { }

  async createUser ({ email, fullName }: CreateUserDto) {
    const user = await this.client.execute({
      sql: 'SELECT email FROM users WHERE email = ?',
      args: [email]
    })

    if (user.rows.length === 0) {
      await this.client.execute({
        sql: 'INSERT INTO users (email, full_name) VALUES (?, ?)',
        args: [email, fullName]
      })
    }
  }
}
