import type { CorsOptions } from 'cors'

// Origins permitidos para hacer peticiones a la API
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:7373',
  'https://money-minder-xi.vercel.app'
]

// Opciones de configuración de CORS
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 204
}

export default corsOptions
