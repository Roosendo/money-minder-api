import express from 'express'
import ReminderController from '../controllers/reminders.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routerReminders = express.Router()
const exitController = new ReminderController()

routerReminders.post('/new-reminder', cors(corsOptions), exitController.newReminder)
routerReminders.get('/get-reminders', cors(corsOptions), exitController.getReminders)
routerReminders.delete('/delete-reminder', cors(corsOptions), exitController.deleteReminder)
routerReminders.patch('/update-reminder', cors(corsOptions), exitController.updateReminder)

export default routerReminders
