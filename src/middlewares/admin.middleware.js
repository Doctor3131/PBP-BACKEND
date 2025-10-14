const { ForbiddenError } = require('../utils/error.util')

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Access denied. Admin only.')
  }

  next()
}

module.exports = { isAdmin }
