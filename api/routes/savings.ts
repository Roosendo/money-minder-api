import express from 'express'
import SavingsController from '../controllers/savings.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routerSavings = express.Router()
const savingsController = new SavingsController()

routerSavings.post('/new-saving', cors(corsOptions), savingsController.newSaving)
routerSavings.get('/get-savings', cors(corsOptions), savingsController.getSavings)
routerSavings.delete('/delete-saving', cors(corsOptions), savingsController.deleteSaving)
routerSavings.patch('/update-saving', cors(corsOptions), savingsController.updateSaving)

export default routerSavings
