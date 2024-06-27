import { bootstrapServerless } from '@/bootstrap.nest'

let server: any
export const handler = async (event: any, context: any, callback: any) => {
  server = server ?? (await bootstrapServerless())
  return server(event, context, callback)
}
