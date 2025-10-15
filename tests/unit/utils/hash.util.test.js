const { hashPassword, comparePassword } = require('../../../src/utils/hash.util')

describe('Hash Utility Tests', () => {
  const plainPassword = 'TestPassword123'
  let hashedPassword

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      hashedPassword = await hashPassword(plainPassword)

      expect(hashedPassword).toBeDefined()
      expect(typeof hashedPassword).toBe('string')
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(plainPassword)
      const hash2 = await hashPassword(plainPassword)

      expect(hash1).not.toBe(hash2)
    })

    it('should hash different passwords differently', async () => {
      const hash1 = await hashPassword('Password1')
      const hash2 = await hashPassword('Password2')

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', async () => {
      const hash = await hashPassword('')

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100)
      const hash = await hashPassword(longPassword)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should handle special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const hash = await hashPassword(specialPassword)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })
  })

  describe('comparePassword', () => {
    beforeAll(async () => {
      hashedPassword = await hashPassword(plainPassword)
    })

    it('should return true for correct password', async () => {
      const result = await comparePassword(plainPassword, hashedPassword)

      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const result = await comparePassword('WrongPassword', hashedPassword)

      expect(result).toBe(false)
    })

    it('should return false for empty password', async () => {
      const result = await comparePassword('', hashedPassword)

      expect(result).toBe(false)
    })

    it('should return false for similar but not exact password', async () => {
      const result = await comparePassword('TestPassword124', hashedPassword)

      expect(result).toBe(false)
    })

    it('should be case sensitive', async () => {
      const result = await comparePassword('testpassword123', hashedPassword)

      expect(result).toBe(false)
    })

    it('should return false for invalid hash format', async () => {
      const result = await comparePassword(plainPassword, 'invalid_hash')

      expect(result).toBe(false)
    })
  })

  describe('Integration', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'MySecurePassword456'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should fail verification with wrong password', async () => {
      const password = 'CorrectPassword'
      const hash = await hashPassword(password)
      const isValid = await comparePassword('WrongPassword', hash)

      expect(isValid).toBe(false)
    })
  })
})
