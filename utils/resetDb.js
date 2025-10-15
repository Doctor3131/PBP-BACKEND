const pool = require('./config/database')
const logger = require('./logger')

const TABLES_TO_RESET = [
  'order_items',
  'orders',
  'cart_items',
  'carts',
  'products',
  'categories',
  'users',
]

const resetDatabase = async () => {
  const client = await pool.connect()

  try {
    logger.info('---------------------------------------------')
    logger.info('DATABASE HARD RESET - TRUNCATING ALL DATA')
    logger.info('---------------------------------------------')

    await client.query('BEGIN')

    const truncateQuery = TABLES_TO_RESET
      .map(table => `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`)
      .join('\n')

    logger.info(`Executing TRUNCATE on tables:\n{\n\t${TABLES_TO_RESET.join(', ')}\n}`)

    await client.query(truncateQuery)

    await client.query('COMMIT')

    logger.info('Database reset complete!')
    logger.info('All data cleared and primary key sequences reset.')
    logger.info('---------------------------------------------')

  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error resetting database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

if (require.main === module) {
  resetDatabase()
    .then(() => {
      logger.info('Database reset script finished.')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Database reset script failed.', error)
      process.exit(1)
    })
}

module.exports = resetDatabase
