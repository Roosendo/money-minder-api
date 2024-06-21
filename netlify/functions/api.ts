import express, { Router } from 'express'
import serverless from 'serverless-http'

const api = express()

const router = Router()
router.get('/', (_req, res) => res.send('Hi there you fantastic person!'))

api.use('/api/', router)

export const handler = serverless(api)
