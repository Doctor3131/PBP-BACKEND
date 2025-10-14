const successResponse = (res, data, statusCode = 200, message = null) => {
  const response = {
    success: true,
  }

  if (message) {
    response.message = message
  }

  if (data !== undefined) {
    response.data = data
  }

  return res.status(statusCode).json(response)
}

const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  }

  if (errors) {
    response.errors = errors
  }

  return res.status(statusCode).json(response)
}

module.exports = { successResponse, errorResponse }
