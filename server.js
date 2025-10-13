const express = require('express')
const logger = require('./utils/logger')

const { PORT } = require('./utils/config/envConfig')

const app = express()

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
})

module.exports = app
