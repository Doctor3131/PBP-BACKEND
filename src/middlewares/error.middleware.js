const logger = require('../../utils/logger')
const { AppError } = require('../utils/error.util')

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  })

  const getShortStack = (stack) => {
    if (!stack) return ''

    const lines = stack.split('\n')

    return lines.slice(0, 4).join('\n')
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
    })
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
    })
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource not found',
    })
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  })
}

module.exports = errorMiddleware
