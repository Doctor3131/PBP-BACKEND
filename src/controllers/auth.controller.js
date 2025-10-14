const authService = require('../services/auth.service')
const { successResponse } = require('../utils/response.util') //

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    const result = await authService.registerUser(name, email, password)

    const responseData = {
      user: result.user,
      token: result.token,
    }

    return successResponse(res, responseData, 201, 'User registered successfully')
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const result = await authService.loginUser(email, password)

    const responseData = {
      user: result.user,
      token: result.token,
    }

    return successResponse(res, responseData, 200, 'Login successful')
  } catch (error) {
    next(error)
  }
}

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id)

    return successResponse(res, user, 200)
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, getProfile }
