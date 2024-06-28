import type { Config } from './config.interface'

const config: Config = {
  nest: {
    port: +(process.env.PORT || '7373')
  },
  cors: {
    enabled: true
  }
}

export default (): Config => config
