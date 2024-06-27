import { createClient } from '@libsql/client'
import { ConfigService } from '@nestjs/config'
import { Provider } from '@nestjs/common'

export const databaseProviders: Provider[] = [
  {
    provide: 'DATABASE_CLIENT',
    useFactory: (configService: ConfigService) => {
      return createClient({
        url: configService.get<string>('TURSO_DATABASE_URL') ?? '',
        authToken: configService.get<string>('TURSO_AUTH_TOKEN') ?? ''
      })
    },
    inject: [ConfigService]
  }
]
