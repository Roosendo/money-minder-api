import { client } from '../config/tursoClient.js'

export default class User {
  static async createUser (
    { email, fullName }: { email: string, fullName: string}
  ) {
    const user = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    })

    if (user.rows.length === 0) {
      await client.execute({
        sql: 'INSERT INTO users (email, full_name) VALUES (?, ?)',
        args: [email, fullName]
      })
    }
  }
}
