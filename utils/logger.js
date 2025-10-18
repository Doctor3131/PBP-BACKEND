const winston = require('winston')

const customColors = {
  info: 'blue',
  warn: 'yellow',
  error: 'red',
  debug: 'magenta',
  http: 'green',
}

const colors = {
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

winston.addColors(customColors)

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    const level = info.level
    const levelColored = `${colors.blue}[${colors.reset} ${info.level} ${colors.blue}]${colors.reset}`
    const timestamp = `${colors.blue}${info.timestamp}${colors.reset}`

    if (level === 'info') {
      return `${timestamp} ${levelColored} ${info.message}`
    }

    if (level === 'http') {
      // Extract status code from message (assuming format like "GET /path 409" or "409 - message")
      const statusMatch = info.message.match(/\b([1-5]\d{2})\b/)
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : null

      // 4xx status codes (client errors) - yellow
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        const levelWarn = `${colors.yellow}${level}${colors.reset}`
        const levelHttp40 = `${colors.blue}[${colors.reset} ${levelWarn} ${colors.blue}]${colors.reset}`
        const messageHttp40 = `${colors.yellow}${info.message}${colors.reset}`

        return `${timestamp} ${levelHttp40} ${messageHttp40}`
      }

      // 5xx status codes (server errors) - red
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        const levelError = `${colors.red}${level}${colors.reset}`
        const levelHttp50 = `${colors.blue}[${colors.reset} ${levelError} ${colors.blue}]${colors.reset}`
        const messageHttp50 = `${colors.red}${info.message}${colors.reset}`

        return `${timestamp} ${levelHttp50} ${messageHttp50}`
      }

      // All other HTTP logs (2xx, 3xx, etc.) - default green
      const levelDev = `${colors.green}${info.level}${colors.reset}`
      const levelHttp = `${colors.blue}[${colors.reset} ${levelDev} ${colors.blue}]${colors.reset}`
      const messageHttp = `${colors.green}${info.message}${colors.reset}`

      return `${timestamp} ${levelHttp} ${messageHttp}`
    }

    // FOR WARN
    if (level === 'warn') {
      const levelWarn = `${colors.yellow}${level}${colors.reset}`
      const logWarn = `${colors.blue}[${colors.reset} ${levelWarn} ${colors.blue}]${colors.reset}`
      const messageWarn = `${colors.yellow}${info.message}${colors.reset}`

      return `${timestamp} ${logWarn} ${messageWarn}\n{\n ${info.stack}\n}`
    }

    // FOR ERROR
    if (level === 'error') {
      const levelError = `${colors.red}${level}${colors.reset}`
      const logError = `${colors.blue}[${colors.reset} ${levelError} ${colors.blue}]${colors.reset}`
      const messageError = `${colors.red}${info.message}${colors.reset}`

      return `${timestamp} ${logError} ${messageError}\n{\n ${info.stack}\n}`
    }

    // others
    let log = `${timestamp} ${levelColored} ${info.message}`

    if (info.stack) {
      log = `${log}\n${info.stack}`
    }

    return log
  }),
  winston.format.colorize({ all: true }),
)

const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      level: 'http',
      format: consoleFormat,
    }),
  ],
})

module.exports = logger
