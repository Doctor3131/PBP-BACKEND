const request = require('supertest')
const app = require('../../src/app')
const pool = require('../../utils/config/database')

describe('Auth Integration Tests', () => {
  const testUser = {
    name: 'Integration Test User',
    email: 'integration@example.com',
    password: 'Integration123',
    role: 'customer',
  }

  let authToken = null
  let testUserId = null

  const deleteTestUser = async () => {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE email = $1 RETURNING id',
        [testUser.email],
      )

      if (result.rows.length > 0) {
        console.log(`Deleted test user with ID: ${result.rows[0].id}`)
      }
    } catch (error) {
      console.error('Error deleting test user:', error.message)
    }
  }

  const checkTestUserExists = async () => {
    try {
      const result = await pool.query(
        'SELECT id, email FROM users WHERE email = $1',
        [testUser.email],
      )

      return result.rows[0] || null
    } catch (error) {
      console.error('Error checking test user:', error.message)

      return null
    }
  }

  beforeAll(async () => {
    const existingUser = await checkTestUserExists()

    if (existingUser) {
      console.log(`Test user already exists with ID: ${existingUser.id}. Deleting...`)
      await deleteTestUser()
    }

    console.log('Setup complete: Database is ready for tests')
  })

  afterAll(async () => {
    await deleteTestUser()
    await pool.end()

    console.log('Cleanup complete: Test data removed and connections closed')
  })

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.user.name).toBe(testUser.name)
      expect(response.body.data.user.role).toBe('customer')
      expect(response.body.data.user).not.toHaveProperty('password_hash')

      testUserId = response.body.data.user.id
      authToken = response.body.data.token
    })

    it('should fail to register with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: testUser.email,
          password: 'AnotherPass123',
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email already registered')
    })

    it('should fail to register with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'invalid-email',
          password: 'Test123456',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should fail to register with short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass User',
          email: 'shortpass@example.com',
          password: '12345',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should fail to register with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'missing@example.com',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should fail to register with short name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'AB',
          email: 'shortname@example.com',
          password: 'Test123456',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.user).not.toHaveProperty('password_hash')

      authToken = response.body.data.token
    })

    it('should fail to login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should fail to login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123456',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should fail to login with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })
  })

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data).toHaveProperty('email')
      expect(response.body.data).toHaveProperty('name')
      expect(response.body.data).toHaveProperty('role')
      expect(response.body.data.email).toBe(testUser.email)
      expect(response.body.data.name).toBe(testUser.name)
      expect(response.body.data).not.toHaveProperty('password_hash')
    })

    it('should fail to get profile without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No token provided')
    })

    it('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid token')
    })

    it('should fail to get profile with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', authToken)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No token provided')
    })

    it('should fail to get profile with expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalid'

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(['Token expired', 'Invalid token']).toContain(response.body.message)
    })
  })

  describe('Database State Verification', () => {
    it('should verify test user exists in database after registration', async () => {
      const user = await checkTestUserExists()

      expect(user).not.toBeNull()
      expect(user.email).toBe(testUser.email)
      expect(user.id).toBe(testUserId)
    })

    it('should verify user can be queried directly from database', async () => {
      const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [testUserId],
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].name).toBe(testUser.name)
      expect(result.rows[0].email).toBe(testUser.email)
      expect(result.rows[0].role).toBe('customer')
    })

    it('should verify password is hashed in database', async () => {
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [testUserId],
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].password_hash).toBeDefined()
      expect(result.rows[0].password_hash).not.toBe(testUser.password)
      expect(result.rows[0].password_hash.length).toBeGreaterThan(0)
    })
  })

  describe('Authentication Flow', () => {
    it('should complete full auth flow: register -> login -> profile', async () => {
      const newUser = {
        name: 'Flow Test User',
        email: 'flowtest@example.com',
        password: 'FlowTest123',
      }

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      const registerToken = registerResponse.body.data.token
      const userId = registerResponse.body.data.user.id

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      const loginToken = loginResponse.body.data.token

      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(profileResponse.body.success).toBe(true)
      expect(profileResponse.body.data.email).toBe(newUser.email)
      expect(profileResponse.body.data.name).toBe(newUser.name)

      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    })

    it('should issue different tokens on each login', async () => {
      const loginResponse1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      const loginResponse2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      const token1 = loginResponse1.body.data.token
      const token2 = loginResponse2.body.data.token

      expect(token1).not.toBe(token2)
    })

    it('should allow access to profile with both registration and login tokens', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Token Test User',
          email: 'tokentest@example.com',
          password: 'TokenTest123',
        })
        .expect(201)

      const registerToken = registerResponse.body.data.token
      const userId = registerResponse.body.data.user.id

      const profileResponse1 = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200)

      expect(profileResponse1.body.success).toBe(true)

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'tokentest@example.com',
          password: 'TokenTest123',
        })
        .expect(200)

      const loginToken = loginResponse.body.data.token

      const profileResponse2 = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(profileResponse2.body.success).toBe(true)
      expect(profileResponse2.body.data.id).toBe(userId)

      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    })
  })
})
