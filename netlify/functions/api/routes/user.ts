import express from 'express'
import UserController from '../controllers/user.js'
import cors from 'cors'
import corsOptions from '../middlewares/corsConfig.js'

const userRouter = express.Router()
const userController = new UserController()

userRouter.post('/create', cors(corsOptions), userController.createUser)

export default userRouter
