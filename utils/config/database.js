const { Pool } = require('pg')
const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, NODE_ENV } = require('./envConfig')
const logger = require('../logger')

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database')
})

pool.on('error', (error) => {
  logger.error('Unexpected error on idle client', error)
})

module.exports = pool
