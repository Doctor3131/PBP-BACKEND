const request = require('supertest')
const app = require('../../src/app')
const pool = require('../../utils/config/database')
const runIntegratedSeed = require('../../database/seeds/runIntegratedSeed')

describe('Image Fetching API Integration Tests', () => {

  beforeAll(async () => {
    // Ensure the database is seeded with products and categories
    await runIntegratedSeed()
  })

  afterAll(async () => {
    // Close the database connection pool
    await pool.end()
  })

  describe('GET /api/v1/images/products/:id', () => {
    it('should successfully fetch an existing product image (e.g., 1.webp)', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/1')
        .expect(200)

      // Verify the response is an image
      expect(response.headers['content-type']).toMatch(/image\/webp/)
    })

    it('should successfully fetch another existing product image (e.g., 2.jpeg)', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/2')
        .expect(200)

      // Verify the response is an image
      expect(response.headers['content-type']).toMatch(/image\/jpeg/)
    })

    it('should return a fallback image from the same category if a product image does not exist', async () => {
      // Product ID 5 belongs to category 1 but doesn't have a dedicated image.
      // The test expects it to fall back to an image from another product in the same category (like product 1, 2, 3 or 4).
      const response = await request(app)
        .get('/api/v1/images/products/5')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image/)
    })

    it('should return the global placeholder image if no product or category fallback is found', async () => {
      // Use a product ID from a category where no products have images
      const response = await request(app)
        .get('/api/v1/images/products/100') // Assuming product 100 exists but has no image and its category has no images.
        .expect(200)

      expect(response.headers['content-type']).toMatch(/image\/jpeg/) // Placeholder is a JPG
    })

    it('should return a 404 Not Found for a product that does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/99999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No image available')
    })

    it('should return a 400 Bad Request for an invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/v1/images/products/invalid-id')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid product ID')
    })
  })
})
