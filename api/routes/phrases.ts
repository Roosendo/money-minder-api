import express from 'express'
import PhraseController from '../controllers/phrases.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const routerPhrase = express.Router()
const phraseController = new PhraseController()

routerPhrase.get('/daily-phrase', cors(corsOptions), phraseController.getDailyPhrase)

export default routerPhrase
