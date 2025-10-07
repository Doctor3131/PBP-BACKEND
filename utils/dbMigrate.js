const { spawn } = require('child_process')
const path = require('path')
const { DB_HOST, DB_USER, DB_NAME } = require('../config/envConfig')
const logger = require('./logger')

const schemaPath = path.join(process.cwd(), 'database/migrate', 'schema.sql')

const psqlArgs = [
  '-h',
  DB_HOST,
  '-U',
  DB_USER,
  '-d',
  DB_NAME,
  '-f',
  schemaPath,
]

logger.info(`Running migration: psql ${psqlArgs.join(' ')}`)

const psql = spawn('psql', psqlArgs, { stdio: 'inherit' })

psql.ong('error', (error) => {
  logger.error('Failed to start psql process. Is psql installed and in your PATH?')
  logger.error(error)
  process.exit(1)
})

psql.on('close', (code) => {

  if (code !== 0) {
    logger.error(`psql process exited with code ${code}`)
  } else {
    logger.info('Database migration completed successfully.')
  }

  process.exit(code)
})
