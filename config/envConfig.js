require('dotenv').config()

const DB_LOCATION = process.env.DB_LOCATION
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const DB_USER = process.env.DB_USER

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION = process.env.JWT_EXPIRATION

const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
const missing = requiredEnvVars.filter(v => !process.env[v])

if (missing.length > 0) {
  throw new Error('Missing env var:', missing.join(', '))
}

module.exports = {
  DB_LOCATION,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  PORT,
  NODE_ENV,
  JWT_EXPIRATION,
  JWT_SECRET
}
