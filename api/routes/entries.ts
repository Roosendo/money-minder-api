import express from 'express'
import EntryController from '../controllers/entries.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routereEntry = express.Router()
const entryController = new EntryController()

routereEntry.post('/new-entry', cors(corsOptions), entryController.newEntry)
routereEntry.get('/get-entries', cors(corsOptions), entryController.getEntries)
routereEntry.get('/get-entries-by-category-monthly', cors(corsOptions), entryController.getEntriesByCategoryMonthly)
routereEntry.get('/get-monthly-summary', cors(corsOptions), entryController.getMonthlySummary)
routereEntry.get('/get-yearly-summary', cors(corsOptions), entryController.getYearlySummary)
routereEntry.get('/get-entry-cash-flow', cors(corsOptions), entryController.getEntryCashFlow)
routereEntry.get('/get-entries-by-category-yearly', cors(corsOptions), entryController.getEntriesByCategoryYearly)

export default routereEntry
