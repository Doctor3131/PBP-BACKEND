//
// const jwt = require('jsonwebtoken')
// const { JWT_SECRET, JWT_EXPIRATION } = require('../../utils/config/envConfig')
//
// const generateToken = (payload) => {
//   return jwt.sign(payload, JWT_SECRET, {
//     expiresIn: JWT_EXPIRATION || '24h',
//   })
// }
//
// const verifyToken = (token) => {
//   return jwt.verify(token, JWT_SECRET)
// }
//
// module.exports = { generateToken, verifyToken }

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { JWT_SECRET, JWT_EXPIRATION } = require('../../utils/config/envConfig')

const generateToken = (payload) => {
  const jti = crypto.randomBytes(16).toString('hex')

  return jwt.sign(
    { ...payload, jti },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION || '24h' },
  )
}

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = { generateToken, verifyToken }
