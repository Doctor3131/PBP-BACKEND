const request = require('supertest')
const app = require('../../src/app')
const pool = require('../../utils/config/database')
const runIntegratedSeed = require('../../database/seeds/runIntegratedSeed')
const fs = require('fs').promises
const path = require('path')

describe('Image API Integration Tests', () => {
  const adminCreds = { email: 'admin@keystore.com', password: 'password123' }
  const customerCreds = { email: 'agus@example.com', password: 'password123' }

  let adminToken
  let customerToken
  let testProductId

  const imageDir = path.join(__dirname, '../../public/images/products')

  beforeAll(async () => {
    await runIntegratedSeed()

    // Login as admin to get token
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send(adminCreds)
      .expect(200)

    adminToken = adminLogin.body.data.token

    // Login as customer to get token
    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send(customerCreds)
      .expect(200)

    customerToken = customerLogin.body.data.token

    // Get a product to use for testing
    const products = await request(app)
      .get('/api/v1/products')
      .expect(200)

    testProductId = products.body.data[0].id
  })

  afterAll(async () => {
    // Clean up any created test files
    try {
      await fs.unlink(path.join(imageDir, `${testProductId}.jpg`)).catch(() => { })
      await fs.unlink(path.join(imageDir, `${testProductId}-1.jpg`)).catch(() => { })
      await fs.unlink(path.join(imageDir, `${testProductId}-2.jpg`)).catch(() => { })
    } catch (error) {
      // Suppress errors during cleanup
    }

    await pool.end()
  })

  describe('GET /api/v1/images/products/:id', () => {
    it('should return the main image for a product that exists', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return a fallback image from the same category if the main image is missing', async () => {
      // Product 5 has no image, but is in the same category as products with images
      const response = await request(app)
        .get('/api/v1/images/products/5')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return a 400 Bad Request for an invalid product ID', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/abc')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid product ID')
    })
  })

  describe('GET /api/v1/images/products/:id/:number', () => {
    it('should return a numbered image if it exists', async () => {
      // Assuming product 1 has a numbered image from seeding or prior tests
      const response = await request(app)
        .get('/api/v1/images/products/1/1')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should fall back to the main image if the numbered image does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/99') // Assuming 99 does not exist
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return a 400 Bad Request for an invalid image number', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/abc')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid image number')
    })
  })

  describe('GET /api/v1/images/products/:id/info', () => {
    it('should return image metadata for a product', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/info')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('product_id', 1)
      expect(response.body.data).toHaveProperty('images_count')
      expect(Array.isArray(response.body.data.images)).toBe(true)
    })

    it('should return a 404 Not Found for a non-existent product', async () => {
      await request(app)
        .get('/api/v1/images/products/99999/info')
        .expect(404)
    })
  })

  describe('POST /api/v1/images/products/:id/upload', () => {
    it('should allow an admin to upload a single image', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Image uploaded successfully')
      expect(response.body.data).toHaveProperty('product_id', testProductId)
    })

    it('should forbid a non-admin user from uploading an image', async () => {
      await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(403)
    })

    it('should return 400 if no file is provided', async () => {
      await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)
    })
  })

  describe('POST /api/v1/images/products/:id/upload-multiple', () => {
    it('should allow an admin to upload multiple images', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload-multiple`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('images', Buffer.from('fake-image-1'), 'test-1.jpg')
        .attach('images', Buffer.from('fake-image-2'), 'test-2.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.count).toBe(2)
      expect(response.body.data.images.length).toBe(2)
    })

    it('should return 403 for a non-admin user', async () => {
      await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload-multiple`)
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('images', Buffer.from('fake-image-1'), 'test-1.jpg')
        .expect(403)
    })
  })

  describe('DELETE /api/v1/images/products/:id', () => {
    beforeEach(async () => {
      // Ensure a file exists to be deleted
      await fs.writeFile(path.join(imageDir, `${testProductId}.jpg`), 'test-data')
    })

    it('should allow an admin to delete the main image', async () => {
      const response = await request(app)
        .delete(`/api/v1/images/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Image deleted successfully')
    })

    it('should return 404 if the image to delete does not exist', async () => {
      await request(app)
        .delete('/api/v1/images/products/99998') // Non-existent
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })

  describe('DELETE /api/v1/images/products/:id/:number', () => {
    beforeEach(async () => {
      // Ensure a numbered file exists to be deleted
      await fs.writeFile(path.join(imageDir, `${testProductId}-1.jpg`), 'test-data')
    })

    it('should allow an admin to delete a numbered image', async () => {
      const response = await request(app)
        .delete(`/api/v1/images/products/${testProductId}/1`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Image 1 deleted successfully')
    })
  })
})
