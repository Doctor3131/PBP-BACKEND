const { verifyToken } = require('../utils/jwt.util')
const userRepository = require('../repositories/user.repository')
const { UnauthorizedError } = require('../utils/error.util')

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided')
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    const user = await userRepository.findById(decoded.userId)

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token'))
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'))
    } else {
      next(error)
    }
  }
}

module.exports = { authenticate }
