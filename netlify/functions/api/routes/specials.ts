import express from 'express'
import SpecialController from '../controllers/specials.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const specialRouter = express.Router()
const specialController = new SpecialController()

specialRouter.get('/financial-summary-yearly', cors(corsOptions), specialController.financialSumaryYearly)
specialRouter.get('/financial-summary-monthly', cors(corsOptions), specialController.financialSumaryMonthly)
specialRouter.get('/cash-flow', cors(corsOptions), specialController.cashFlow)
specialRouter.get('/yearly-categories', cors(corsOptions), specialController.yearlyCategories)

export default specialRouter
