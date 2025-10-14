const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const { validate } = require('../middlewares/validate.middleware')
const { authenticate } = require('../middlewares/auth.middleware') // Untuk rute /profile
const { registerSchema, loginSchema } = require('../validators/auth.validator')

router.post(
  '/register',
  validate(registerSchema),
  authController.register,
)

router.post(
  '/login',
  validate(loginSchema),
  authController.login,
)

router.get(
  '/profile',
  authenticate,
  authController.getProfile,
)

module.exports = router
