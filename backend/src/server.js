require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const compression = require('compression')
const routes     = require('./routes/index')

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))
app.use('/api', routes)

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }))
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log('')
  console.log('╔══════════════════════════════════════╗')
  console.log('║   Cultural Art Zone - API Server     ║')
  console.log(`║   Running on: http://localhost:${PORT}  ║`)
  console.log('╚══════════════════════════════════════╝')
  console.log('')
  console.log('  Admin:  admin@culturalzone.com / admin123')
  console.log('  Clerk:  clerk@culturalzone.com / clerk123')
  console.log('  Artist: john@example.com / password123')
  console.log('')
})
