import express from 'express'
import ExitController from '../controllers/exits.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routerExit = express.Router()
const exitController = new ExitController()

routerExit.post('/new-exit', cors(corsOptions), exitController.newExpense)
routerExit.get('/get-exits', cors(corsOptions), exitController.getExpenses)
routerExit.get('/get-exits-by-category-monthly', cors(corsOptions), exitController.getExpensesByCategoryMonthly)
routerExit.get('/get-monthly-summary', cors(corsOptions), exitController.getMonthlySummary)
routerExit.get('/get-yearly-summary', cors(corsOptions), exitController.getYearlySummary)
routerExit.get('/get-expense-cash-flow', cors(corsOptions), exitController.getExpenseCashFlow)
routerExit.get('/get-expenses-by-category-yearly', cors(corsOptions), exitController.getExpensesByCategoryYearly)

export default routerExit
