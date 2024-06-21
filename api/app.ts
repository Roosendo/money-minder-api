import express from 'express'
import cors from 'cors'
import { errorMiddleware } from './middlewares/error.js'
import ServerlessHttp from 'serverless-http'
import 'dotenv/config'

import routerEntry from './routes/entries.js'
import routerExit from './routes/exits.js'
import routerPhrase from './routes/phrases.js'
import routerReminders from './routes/reminders.js'
import routerSavings from './routes/savings.js'

const app = express()
app.use(express.json())
app.use(cors())

app.get('/', (_req, res) => res.send(`Hi there you fantastic person!`))
app.use('/entries', routerEntry)
app.use('/exits', routerExit)
app.use('/phrases', routerPhrase)
app.use('/reminders', routerReminders)
app.use('/savings', routerSavings)

app.use(errorMiddleware)

const PORT = process.env.PORT || 7373
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
export const handler = ServerlessHttp(app)
