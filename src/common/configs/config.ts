import type { Config } from './config.interface'

const config: Config = {
  nest: {
    port: +(process.env.PORT || '7373')
  },
  cors: {
    enabled: true,
    allowedOrigins: ['http://localhost:4321', 'https://money-minder-xi.vercel.app']
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
