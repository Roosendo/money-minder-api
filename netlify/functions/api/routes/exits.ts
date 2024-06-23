import express from 'express'
import ExitController from '../controllers/exits.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routerExit = express.Router()
const exitController = new ExitController()

routerExit.post('/new-exit', cors(corsOptions), exitController.newExpense)
routerExit.get('/get-exits', cors(corsOptions), exitController.getExpenses)
routerExit.get('/get-exits-by-category-monthly', cors(corsOptions), exitController.getExpensesByCategoryMonthly)

export default routerExit
