
const logger = require('../../utils/logger')

const loggerMiddleware = (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`

    logger.http(message)
  })

  next()
}

module.exports = loggerMiddleware
