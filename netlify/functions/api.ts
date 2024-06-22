import express from 'express'
import cors from 'cors'
import { errorMiddleware } from '../../api/middlewares/error.js'
import ServerlessHttp from 'serverless-http'
import 'dotenv/config'

import routerEntry from '../../api/routes/entries.js'
import routerExit from '../../api/routes/exits.js'
import routerPhrase from '../../api/routes/phrases.js'
import routerReminders from '../../api/routes/reminders.js'
import routerSavings from '../../api/routes/savings.js'

const app = express()
app.use(express.json())
app.use(cors())

app.get('/api/', (_req, res) => res.send(`Hi there you fantastic person!`))
app.use('/api/entries', routerEntry)
app.use('/api/exits', routerExit)
app.use('/api/phrases', routerPhrase)
app.use('/api/reminders', routerReminders)
app.use('/api/savings', routerSavings)

app.use(errorMiddleware)

export const handler = ServerlessHttp(app)
