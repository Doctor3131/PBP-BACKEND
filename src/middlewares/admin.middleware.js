// const { ForbiddenError } = require('../utils/error.util')
//
// const isAdmin = (req, res, next) => {
//   // if (req.user.role !== 'admin') {
//   //   throw new ForbiddenError('Access denied. Admin only.')
//   // }
//   //
//   // next()
//   try {
//     if (req.user.role !== 'admin') {
//       throw new ForbiddenError('Access denied. Admin only.')
//     }
//
//     next()
//   } catch (error) {
//     next(error)
//   }
//
// }
//
// module.exports = { isAdmin }

const { ForbiddenError } = require('../utils/error.util')

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Access denied. Admin only.'))
  }

  next()
}

module.exports = { isAdmin }
