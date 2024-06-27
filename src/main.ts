import { bootstrap } from './bootstrap.nest'
import type { NestConfig } from '@/common/configs/config.interface'
import { ConfigService } from '@nestjs/config'

const startServer = async () => {
  const app = await bootstrap()
  console.log('Starting server...')
  const configService = app.get(ConfigService)
  const nestConfig = configService.get<NestConfig>('nest')

  await app.listen(nestConfig.port)
}
startServer()
