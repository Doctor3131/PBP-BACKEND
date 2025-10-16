const request = require('supertest')
const app = require('../../src/app')
const pool = require('../../utils/config/database')
const runIntegratedSeed = require('../../database/seeds/runIntegratedSeed')

describe('E-commerce API Integration Tests (Products, Categories, Cart, Orders, Admin)', () => {
  const customerCreds = { email: 'agus@example.com', password: 'password123' }
  const adminCreds = { email: 'admin@keystore.com', password: 'password123' }

  let customerToken
  let adminToken
  let cartItemId
  let createdProductId
  let createdOrderId
  let createdCategoryId

  const testProductId = 1
  const productSeed = {
    name: 'Integration Test Product X',
    price: 99000.00,
    stock: 50,
    category_id: 1,
    is_active: true,
  }

  beforeAll(async () => {
    await runIntegratedSeed()

    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send(customerCreds)
      .expect(200)

    customerToken = customerLogin.body.data.token

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send(adminCreds)
      .expect(200)

    adminToken = adminLogin.body.data.token
  })

  afterAll(async () => {
    await pool.query('DELETE FROM products WHERE id = $1', [createdProductId]).catch(() => { })
    await pool.query('DELETE FROM categories WHERE id = $1', [createdCategoryId]).catch(() => { })

    await pool.end()
  })

  describe('PUBLIC ENDPOINTS (Products & Categories)', () => {
    it('GET /categories should return a list of categories successfully', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0]).toHaveProperty('name')
    })

    it('GET /products should return a list of products with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=5&sort=price_asc')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBe(5)
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data[0]).toHaveProperty('category_name')
      expect(response.body.pagination.limit).toBe(5)
    })

    it('GET /products/:id should return detail of a single product (ID 1)', async () => {
      const response = await request(app)
        .get('/api/v1/products/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id', 1)
      expect(response.body.data).toHaveProperty('name', 'GMMK Pro 75% Black')
      expect(response.body.data).toHaveProperty('price')
    })

    it('GET /products/:id should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/99999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Resource not found')
    })
  })

  describe('CUSTOMER FLOW (Cart & Orders)', () => {
    beforeEach(async () => {
      await request(app)
        .delete('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${customerToken}`)
    })

    it('POST /cart should add a new item and track cartItemId', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: testProductId, qty: 2 })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Item added to cart successfully')
      expect(response.body.data).toHaveProperty('product_id', testProductId)
      cartItemId = response.body.data.id
    })

    it('POST /cart should update quantity when adding the same product', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: testProductId, qty: 1 })
        .expect(201)

      expect(response.body.data).toHaveProperty('qty', 3)
    })

    it('GET /cart should return the cart with correct items and calculate total', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)

      expect(response.body.data.items.length).toBe(1)
      expect(response.body.data.items[0].qty).toBe(3)
      expect(parseFloat(response.body.data.total)).toBe(10500000.00)
    })

    it('PUT /cart/items/:id should update item quantity directly', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ qty: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('qty', 5)
    })

    it('DELETE /cart/items/:id should remove an item from the cart', async () => {
      await request(app)
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)

      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(cartResponse.body.data.items.length).toBe(0)
    })

    it('POST /cart should fail with insufficient stock', async () => {
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: testProductId, qty: 1 })

      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: testProductId, qty: 100 })
        .expect(400)

      expect(response.body.message).toContain('Insufficient stock')
    })

    it('POST /orders should create a new order (checkout) and empty the cart', async () => {
      const address = 'Jalan Checkout No. 123'
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_text: address })
        .expect(201)

      expect(response.body.message).toBe('Order created successfully')
      expect(response.body.data).toHaveProperty('status', 'Pending')
      expect(response.body.data.items.length).toBe(1)

      createdOrderId = response.body.data.id

      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(cartResponse.body.data.items.length).toBe(0)
    })

    it('POST /orders should fail if cart is empty', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_text: 'Any address' })
        .expect(400)

      expect(response.body.message).toBe('Cart is empty')
    })

    it('GET /orders should return a list of user orders with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)

      expect(response.body.data.length).toBe(1)
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination.total).toBeGreaterThan(0)
    })

    it('GET /orders/:id should return detail of the user\'s order', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)

      expect(response.body.data).toHaveProperty('id', createdOrderId)
      expect(response.body.data).toHaveProperty('items')
    })

    it('GET /orders/:id should return 403 Forbidden for another user\'s order', async () => {
      const budiLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'budi@example.com', password: 'password123' })
        .expect(200)
      const budiToken = budiLogin.body.data.token

      const response = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${budiToken}`)
        .expect(403)

      expect(response.body.message).toBe('Access denied')
    })
  })

  describe('ADMIN FLOW (CRUD & Management)', () => {
    it('POST /categories should create a new category (Admin)', async () => {
      const newCategory = { name: 'Test Category for Admin' }
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('name', newCategory.name)
      createdCategoryId = response.body.data.id
    })

    it('POST /categories should return 403 for non-admin user', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Should Fail' })
        .expect(403)
    })

    it('PUT /categories/:id should update a category (Admin)', async () => {
      const updatedName = 'Updated Test Category by Admin'
      const response = await request(app)
        .put(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: updatedName })
        .expect(200)

      expect(response.body.data).toHaveProperty('name', updatedName)
    })

    it('POST /products should create a new product (Admin)', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productSeed)
        .expect(201)

      expect(response.body.data).toHaveProperty('name', productSeed.name)
      createdProductId = response.body.data.id
    })

    it('PUT /products/:id should update product stock (Admin)', async () => {
      const newStock = 25
      const response = await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: newStock })
        .expect(200)

      expect(response.body.data).toHaveProperty('stock', newStock)
    })

    it('DELETE /products/:id should delete the created product (Admin)', async () => {
      await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      await request(app)
        .get(`/api/v1/products/${createdProductId}`)
        .expect(404)

      createdProductId = null
    })

    it('DELETE /categories/:id should clean up the created category (Admin)', async () => {
      await request(app)
        .delete(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    })

    it('GET /admin/orders should return all orders (Admin)', async () => {
      const response = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('PATCH /admin/orders/:id/status should update order status', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Shipped' })
        .expect(200)

      expect(response.body.message).toBe('Order status updated successfully')
      expect(response.body.data).toHaveProperty('status', 'Shipped')
    })

    it('PATCH /admin/orders/:id/status should return 403 for non-admin user', async () => {
      await request(app)
        .patch(`/api/v1/admin/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'Completed' })
        .expect(403)
    })

    it('GET /admin/dashboard should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data).toHaveProperty('total_orders')
      expect(response.body.data.total_orders).toBeGreaterThan(0)
      expect(response.body.data).toHaveProperty('total_revenue')
    })

    it('GET /admin/dashboard should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403)
    })
  })
})
