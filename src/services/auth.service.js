const userRepository = require('../repositories/user.repository')
const { hashPassword, comparePassword } = require('../utils/hash.util') //
const { generateToken } = require('../utils/jwt.util') //
const { UnauthorizedError, ConflictError, NotFoundError } = require('../utils/error.util') //

const registerUser = async (name, email, password) => {
  const existingUser = await userRepository.findByEmail(email)

  if (existingUser) {
    throw new ConflictError('Email already registered')
  }

  const passwordHash = await hashPassword(password)

  const newUser = await userRepository.create({ name, email, passwordHash, role: 'customer' })

  const token = generateToken({ userId: newUser.id, role: newUser.role })

  return { user: newUser, token }
}

const loginUser = async (email, password) => {
  const user = await userRepository.findByEmail(email)

  if (!user) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const isPasswordValid = await comparePassword(password, user.password_hash)

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const token = generateToken({ userId: user.id, role: user.role })

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  }

  return { user: userData, token }
}

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId)

  if (!user) {
    throw new NotFoundError('User profile not found')
  }

  return user
}

module.exports = { registerUser, loginUser, getProfile }
