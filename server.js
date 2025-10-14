const app = require('./src/app')
const logger = require('./utils/logger')
const { PORT } = require('./utils/config/envConfig')
const testConnection = require('./utils/testConnection')

const startServer = async () => {
  try {
    const dbConnected = await testConnection()

    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...')
      process.exit(1)
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

startServer()

module.exports = app
