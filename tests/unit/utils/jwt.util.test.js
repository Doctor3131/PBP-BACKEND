const { generateToken, verifyToken } = require('../../../src/utils/jwt.util')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../../../utils/config/envConfig')

describe('JWT Utility Tests', () => {
  const testPayload = {
    userId: 1,
    role: 'customer',
  }

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    it('should generate different tokens for same payload', () => {
      const token1 = generateToken(testPayload)
      const token2 = generateToken(testPayload)

      expect(token1).not.toBe(token2)
    })

    it('should include payload data in token', () => {
      const token = generateToken(testPayload)
      const decoded = jwt.decode(token)

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.role).toBe(testPayload.role)
    })

    it('should include expiration time', () => {
      const token = generateToken(testPayload)
      const decoded = jwt.decode(token)

      expect(decoded.exp).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should include issued at time', () => {
      const token = generateToken(testPayload)
      const decoded = jwt.decode(token)

      expect(decoded.iat).toBeDefined()
      expect(decoded.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
    })

    it('should handle payload with different user roles', () => {
      const adminPayload = { userId: 2, role: 'admin' }
      const token = generateToken(adminPayload)
      const decoded = jwt.decode(token)

      expect(decoded.userId).toBe(2)
      expect(decoded.role).toBe('admin')
    })

    it('should handle payload with additional fields', () => {
      const extendedPayload = { userId: 1, role: 'customer', email: 'test@example.com' }
      const token = generateToken(extendedPayload)
      const decoded = jwt.decode(token)

      expect(decoded.userId).toBe(1)
      expect(decoded.role).toBe('customer')
      expect(decoded.email).toBe('test@example.com')
    })
  })

  describe('verifyToken', () => {
    let validToken

    beforeAll(() => {
      validToken = generateToken(testPayload)
    })

    it('should verify a valid token successfully', () => {
      const decoded = verifyToken(validToken)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.role).toBe(testPayload.role)
    })

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here')
      }).toThrow()
    })

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyToken('not-a-token')
      }).toThrow()
    })

    it('should throw error for token with wrong signature', () => {
      const fakeToken = jwt.sign(testPayload, 'wrong-secret', { expiresIn: '1h' })

      expect(() => {
        verifyToken(fakeToken)
      }).toThrow()
    })

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '0s' })

      setTimeout(() => {
        expect(() => {
          verifyToken(expiredToken)
        }).toThrow()
      }, 1000)
    })

    it('should throw error for empty token', () => {
      expect(() => {
        verifyToken('')
      }).toThrow()
    })

    it('should throw error for null token', () => {
      expect(() => {
        verifyToken(null)
      }).toThrow()
    })

    it('should throw error for undefined token', () => {
      expect(() => {
        verifyToken(undefined)
      }).toThrow()
    })
  })

  describe('Integration', () => {
    it('should generate and verify token correctly', () => {
      const payload = { userId: 123, role: 'admin' }
      const token = generateToken(payload)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.role).toBe(payload.role)
    })

    it('should handle multiple generate and verify cycles', () => {
      for (let i = 0; i < 5; i++) {
        const payload = { userId: i, role: 'customer' }
        const token = generateToken(payload)
        const decoded = verifyToken(token)

        expect(decoded.userId).toBe(i)
        expect(decoded.role).toBe('customer')
      }
    })

    it('should maintain data integrity through encoding and decoding', () => {
      const complexPayload = {
        userId: 999,
        role: 'admin',
        email: 'admin@example.com',
        permissions: ['read', 'write', 'delete'],
      }

      const token = generateToken(complexPayload)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(complexPayload.userId)
      expect(decoded.role).toBe(complexPayload.role)
      expect(decoded.email).toBe(complexPayload.email)
      expect(decoded.permissions).toEqual(complexPayload.permissions)
    })
  })
})
