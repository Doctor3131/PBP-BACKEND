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
  let testImagePath

  const imageDir = path.join(__dirname, '../../public/images/products')
  const testImageFilename = 'test-upload.jpg'
  const testImageBuffer = Buffer.from('fake-image-data')

  beforeAll(async () => {
    await runIntegratedSeed()

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send(adminCreds)
      .expect(200)

    adminToken = adminLogin.body.data.token

    // Login as customer
    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send(customerCreds)
      .expect(200)

    customerToken = customerLogin.body.data.token

    // Get a test product
    const products = await request(app)
      .get('/api/v1/products')
      .expect(200)

    testProductId = products.body.data[0].id

    // Create test image file
    testImagePath = path.join(imageDir, testImageFilename)
  })

  afterAll(async () => {
    // Cleanup test images
    try {
      await fs.unlink(testImagePath).catch(() => { })
      await fs.unlink(path.join(imageDir, `${testProductId}.jpg`)).catch(() => { })
      await fs.unlink(path.join(imageDir, `${testProductId}-1.jpg`)).catch(() => { })
      await fs.unlink(path.join(imageDir, `${testProductId}-2.jpg`)).catch(() => { })
    } catch (error) {
      // Ignore cleanup errors
    }

    await pool.end()
  })

  describe('GET /images/products/:id - Get Product Image', () => {
    it('should return product image if exists', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return fallback image from same category if product image does not exist', async () => {
      // Find a product without an image
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .expect(200)

      // Product 5 doesn't have image, should get fallback from category
      const response = await request(app)
        .get('/api/v1/images/products/5')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/invalid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid product ID')
    })

    it('should include cache headers for performance', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1')
        .expect(200)

      expect(response.headers['cache-control']).toBeDefined()
      expect(response.headers['etag']).toBeDefined()
    })
  })

  describe('GET /images/products/:id/:number - Get Numbered Product Image', () => {
    it('should return numbered product image if exists', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/1')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should fallback to main image if numbered image does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/99')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return 400 for invalid image number', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/invalid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid image number')
    })

    it('should return 400 for negative image number', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/-1')
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /images/products/:id/info - Get Product Image Info', () => {
    it('should return image information for a product', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1/info')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('product_id')
      expect(response.body.data).toHaveProperty('product_name')
      expect(response.body.data).toHaveProperty('category_id')
      expect(response.body.data).toHaveProperty('images_count')
      expect(response.body.data).toHaveProperty('images')
      expect(Array.isArray(response.body.data.images)).toBe(true)
    })

    it('should include fallback information if no images exist', async () => {
      // Find a product without images
      const response = await request(app)
        .get('/api/v1/images/products/99/info')
        .expect(200)

      expect(response.body.data).toHaveProperty('has_fallback')
      expect(response.body.data).toHaveProperty('fallback_url')
    })

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/99999/info')
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /images/products/:id/upload - Upload Single Image', () => {
    it('should upload single product image as admin', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Image uploaded successfully')
      expect(response.body.data).toHaveProperty('product_id', testProductId)
      expect(response.body.data).toHaveProperty('filename')
      expect(response.body.data).toHaveProperty('url')
      expect(response.body.data).toHaveProperty('size')
    })

    it('should return 403 when customer tries to upload image', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Admin only')
    })

    it('should return 401 when uploading without authentication', async () => {
      await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(401)
    })

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No file uploaded')
    })

    it('should return 404 when uploading to non-existent product', async () => {
      const response = await request(app)
        .post('/api/v1/images/products/99999/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Product not found')
    })
  })

  describe('POST /images/products/:id/upload-multiple - Upload Multiple Images', () => {
    it('should upload multiple product images as admin', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload-multiple`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('images', Buffer.from('fake-image-1'), 'test-1.jpg')
        .attach('images', Buffer.from('fake-image-2'), 'test-2.jpg')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('product_id', testProductId)
      expect(response.body.data).toHaveProperty('count', 2)
      expect(response.body.data).toHaveProperty('images')
      expect(Array.isArray(response.body.data.images)).toBe(true)
      expect(response.body.data.images.length).toBe(2)
    })

    it('should return 400 when no files are provided', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload-multiple`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No files uploaded')
    })

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`/api/v1/images/products/${testProductId}/upload-multiple`)
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('images', Buffer.from('fake-image'), 'test.jpg')
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /images/products/:id - Delete Product Image', () => {
    beforeEach(async () => {
      // Create a test image file
      await fs.writeFile(
        path.join(imageDir, `${testProductId}.jpg`),
        'test-image-data',
      )
    })

    it('should delete product image as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/images/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Image deleted successfully')
      expect(response.body.data).toHaveProperty('product_id', testProductId)
      expect(response.body.data).toHaveProperty('deleted_file')
    })

    it('should return 403 when customer tries to delete image', async () => {
      const response = await request(app)
        .delete(`/api/v1/images/products/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 when deleting non-existent image', async () => {
      const response = await request(app)
        .delete('/api/v1/images/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Image not found')
    })
  })

  describe('DELETE /images/products/:id/:number - Delete Numbered Image', () => {
    beforeEach(async () => {
      // Create a test numbered image file
      await fs.writeFile(
        path.join(imageDir, `${testProductId}-1.jpg`),
        'test-image-data',
      )
    })

    it('should delete numbered product image as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/images/products/${testProductId}/1`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Image 1 deleted successfully')
      expect(response.body.data).toHaveProperty('image_number', 1)
    })

    it('should return 400 for invalid image number', async () => {
      const response = await request(app)
        .delete(`/api/v1/images/products/${testProductId}/invalid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Category Fallback Logic', () => {
    it('should use image from same category when product has no image', async () => {
      // Get products in same category
      const category1Products = await pool.query(
        'SELECT id FROM products WHERE category_id = 1 ORDER BY id LIMIT 2',
      )

      const productWithImage = category1Products.rows[0].id
      const productWithoutImage = category1Products.rows[1].id

      // Delete image for second product if exists
      try {
        await fs.unlink(path.join(imageDir, `${productWithoutImage}.jpg`))
      } catch { }

      // Request image for product without image
      const response = await request(app)
        .get(`/api/v1/images/products/${productWithoutImage}`)
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
      // Should get an image (fallback from category)
      expect(response.body).toBeDefined()
    })
  })
})

describe('Image Service Helper Tests', () => {
  const ImageService = require('../../src/utils/imageService')

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(ImageService.formatBytes(0)).toBe('0 Bytes')
      expect(ImageService.formatBytes(1024)).toBe('1 KB')
      expect(ImageService.formatBytes(1048576)).toBe('1 MB')
      expect(ImageService.formatBytes(1073741824)).toBe('1 GB')
    })
  })

  describe('getMimeType', () => {
    it('should return correct MIME types', () => {
      expect(ImageService.getMimeType('.jpg')).toBe('image/jpeg')
      expect(ImageService.getMimeType('.jpeg')).toBe('image/jpeg')
      expect(ImageService.getMimeType('.png')).toBe('image/png')
      expect(ImageService.getMimeType('.webp')).toBe('image/webp')
    })
  })

  describe('validateImageFile', () => {
    it('should validate image files correctly', () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      }

      const result = ImageService.validateImageFile(validFile)

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should reject files that are too large', () => {
      const largeFile = {
        size: 10 * 1024 * 1024, // 10MB
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      }

      const result = ImageService.validateImageFile(largeFile)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid file types', () => {
      const invalidFile = {
        size: 1024 * 1024,
        mimetype: 'application/pdf',
        originalname: 'test.pdf',
      }

      const result = ImageService.validateImageFile(invalidFile)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
