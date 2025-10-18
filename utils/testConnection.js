const pool = require('./config/database')
const logger = require('./logger')
const env = require('./config/envConfig')

const testConnection = async () => {

  try {
    const client = await pool.connect()
    const dbName = env.DB_NAME
    const dbUser = env.DB_USER
    const dbLocation = env.DB_LOCATION

    logger.info(' ')
    logger.info('----------------testConnection result--------------------')
    logger.info('Database connection successful.')
    logger.info(` -> Location:     ${dbLocation}`)
    logger.info(` -> Database:     ${dbName}`)
    logger.info(` -> User    :     ${dbUser}`)
    logger.info('----------------testConnection result--------------------')

    client.release()

    return true

  } catch (error) {
    logger.error('Database connection failed:', error)

    return false
  }
}

if (require.main === module) {
  testConnection().then(success => {
    pool.end()
    process.exit(success ? 0 : 1)
  })

}

module.exports = testConnection
