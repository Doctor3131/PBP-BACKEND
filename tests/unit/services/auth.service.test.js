const authService = require('../../../src/services/auth.service')
const userRepository = require('../../../src/repositories/user.repository')
const { hashPassword, comparePassword } = require('../../../src/utils/hash.util')
const { generateToken, verifyToken } = require('../../../src/utils/jwt.util')
const { UnauthorizedError, ConflictError, NotFoundError } = require('../../../src/utils/error.util')

jest.mock('../../../src/repositories/user.repository')
jest.mock('../../../src/utils/hash.util')
jest.mock('../../../src/utils/jwt.util')

describe('Auth Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerUser', () => {
    const name = 'Test User'
    const email = 'test@example.com'
    const password = 'password123'
    const hashedPassword = 'hashed_password_123'
    const mockUser = {
      id: 1,
      name,
      email,
      role: 'customer',
      created_at: new Date(),
    }
    const mockToken = 'mock_jwt_token'

    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      hashPassword.mockResolvedValue(hashedPassword)
      userRepository.create.mockResolvedValue(mockUser)
      generateToken.mockReturnValue(mockToken)

      const result = await authService.registerUser(name, email, password)

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email)
      expect(hashPassword).toHaveBeenCalledWith(password)
      expect(userRepository.create).toHaveBeenCalledWith({
        name,
        email,
        passwordHash: hashedPassword,
        role: 'customer',
      })
      expect(generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role,
      })
      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      })
    })

    it('should throw ConflictError if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)

      await expect(
        authService.registerUser(name, email, password),
      ).rejects.toThrow(ConflictError)

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email)
      expect(hashPassword).not.toHaveBeenCalled()
      expect(userRepository.create).not.toHaveBeenCalled()
      expect(generateToken).not.toHaveBeenCalled()
    })

    it('should throw ConflictError with correct message', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)

      await expect(
        authService.registerUser(name, email, password),
      ).rejects.toThrow('Email already registered')
    })

    it('should propagate errors from userRepository.create', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      hashPassword.mockResolvedValue(hashedPassword)
      userRepository.create.mockRejectedValue(new Error('Database error'))

      await expect(
        authService.registerUser(name, email, password),
      ).rejects.toThrow('Database error')
    })

    it('should propagate errors from hashPassword', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      hashPassword.mockRejectedValue(new Error('Hashing failed'))

      await expect(
        authService.registerUser(name, email, password),
      ).rejects.toThrow('Hashing failed')
    })
  })

  describe('loginUser', () => {
    const email = 'test@example.com'
    const password = 'password123'
    const mockUser = {
      id: 1,
      name: 'Test User',
      email,
      password_hash: 'hashed_password',
      role: 'customer',
      created_at: new Date(),
    }
    const mockToken = 'mock_jwt_token'

    it('should login user successfully with valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)
      comparePassword.mockResolvedValue(true)
      generateToken.mockReturnValue(mockToken)

      const result = await authService.loginUser(email, password)

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email)
      expect(comparePassword).toHaveBeenCalledWith(password, mockUser.password_hash)
      expect(generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role,
      })
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          created_at: mockUser.created_at,
        },
        token: mockToken,
      })
    })

    it('should not include password_hash in returned user data', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)
      comparePassword.mockResolvedValue(true)
      generateToken.mockReturnValue(mockToken)

      const result = await authService.loginUser(email, password)

      expect(result.user).not.toHaveProperty('password_hash')
    })

    it('should throw UnauthorizedError if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null)

      await expect(
        authService.loginUser(email, password),
      ).rejects.toThrow(UnauthorizedError)

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email)
      expect(comparePassword).not.toHaveBeenCalled()
      expect(generateToken).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError with correct message for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null)

      await expect(
        authService.loginUser(email, password),
      ).rejects.toThrow('Invalid credentials')
    })

    it('should throw UnauthorizedError if password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)
      comparePassword.mockResolvedValue(false)

      await expect(
        authService.loginUser(email, password),
      ).rejects.toThrow(UnauthorizedError)

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email)
      expect(comparePassword).toHaveBeenCalledWith(password, mockUser.password_hash)
      expect(generateToken).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedError with correct message for invalid password', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)
      comparePassword.mockResolvedValue(false)

      await expect(
        authService.loginUser(email, password),
      ).rejects.toThrow('Invalid credentials')
    })

    it('should propagate errors from userRepository.findByEmail', async () => {
      userRepository.findByEmail.mockRejectedValue(new Error('Database error'))

      await expect(
        authService.loginUser(email, password),
      ).rejects.toThrow('Database error')
    })

    it('should propagate errors from comparePassword', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser)
      comparePassword.mockRejectedValue(new Error('Comparison failed'))

      await expect(
        authService.loginUser(email, password),
      ).rejects.toThrow('Comparison failed')
    })
  })

  describe('getProfile', () => {
    const userId = 1
    const mockUser = {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      created_at: new Date(),
    }

    it('should return user profile successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser)

      const result = await authService.getProfile(userId)

      expect(userRepository.findById).toHaveBeenCalledWith(userId)
      expect(result).toEqual(mockUser)
    })

    it('should throw NotFoundError if user not found', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        authService.getProfile(userId),
      ).rejects.toThrow(NotFoundError)

      expect(userRepository.findById).toHaveBeenCalledWith(userId)
    })

    it('should throw NotFoundError with correct message', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        authService.getProfile(userId),
      ).rejects.toThrow('User profile not found')
    })

    it('should propagate errors from userRepository.findById', async () => {
      userRepository.findById.mockRejectedValue(new Error('Database error'))

      await expect(
        authService.getProfile(userId),
      ).rejects.toThrow('Database error')
    })

    it('should handle different user roles', async () => {
      const adminUser = { ...mockUser, role: 'admin' }

      userRepository.findById.mockResolvedValue(adminUser)

      const result = await authService.getProfile(userId)

      expect(result.role).toBe('admin')
    })

    it('should return complete user object without password', async () => {
      userRepository.findById.mockResolvedValue(mockUser)

      const result = await authService.getProfile(userId)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('role')
      expect(result).toHaveProperty('created_at')
      expect(result).not.toHaveProperty('password_hash')
    })
  })
})
