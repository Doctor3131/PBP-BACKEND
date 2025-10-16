const { ValidationError } = require('../utils/error.util')

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, { abortEarly: false })

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }))

        throw new ValidationError('Validation failed', errors)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = { validate }
