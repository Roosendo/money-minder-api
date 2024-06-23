import express from 'express'
import EntryController from '../controllers/entries.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routerEntry = express.Router()
const entryController = new EntryController()

routerEntry.post('/new-entry', cors(corsOptions), entryController.newEntry)
routerEntry.get('/get-entries', cors(corsOptions), entryController.getEntries)
routerEntry.get('/get-entries-by-category-monthly', cors(corsOptions), entryController.getEntriesByCategoryMonthly)

export default routerEntry
