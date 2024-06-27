import type { Config } from './config.interface'

const config: Config = {
  nest: {
    port: +(process.env.PORT || '7373')
  },
  cors: {
    enabled: true
  },
  swagger: {
    enabled: true,
    title: 'Money Minder Api',
    description: '',
    version: '1.0',
    path: ''
  }
}

export default (): Config => config