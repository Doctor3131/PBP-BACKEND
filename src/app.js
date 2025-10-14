const express = require('express')
const logger = require('./utils/logger')
const routes = require('./routes')
const errorMiddleware = require('./middlewares/error.middleware')
const loggerMiddleware = require('./middlewares/logger.middleware')

const app = express()

app.use(express.json())

app.use(loggerMiddleware)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/v1', routes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

app.use(errorMiddleware)

module.exports = app
