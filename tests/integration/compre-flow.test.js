const request = require('supertest')
const app = require('../../src/app')
const pool = require('../../utils/config/database')
const runIntegratedSeed = require('../../database/seeds/runIntegratedSeed')
const resetDb = require('../../utils/resetDb')

describe('Comprehensive E-commerce User Flow', () => {
  let customerToken
  let createdUserId
  let productId
  const customerDetails = {
    name: 'Comprehensive Test User',
    email: 'comprehensive@example.com',
    password: 'password123',
  }

  beforeAll(async () => {
    await resetDb()
    await runIntegratedSeed()
  })

  afterAll(async () => {
    if (createdUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [createdUserId])
    }

    await pool.end()
  })

  test('should allow a user to register, login, add to cart, and checkout', async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(customerDetails)
      .expect(201)

    expect(registerResponse.body.success).toBe(true)
    createdUserId = registerResponse.body.data.user.id

    const userInDb = await pool.query('SELECT * FROM users WHERE id = $1', [createdUserId])

    expect(userInDb.rows.length).toBe(1)
    expect(userInDb.rows[0].email).toBe(customerDetails.email)

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: customerDetails.email,
        password: customerDetails.password,
      })
      .expect(200)

    expect(loginResponse.body.success).toBe(true)
    customerToken = loginResponse.body.data.token

    const productsResponse = await request(app)
      .get('/api/v1/products')
      .expect(200)

    expect(productsResponse.body.data.length).toBeGreaterThan(0)
    productId = productsResponse.body.data[0].id
    const initialStock = productsResponse.body.data[0].stock

    const addToCartResponse = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ product_id: productId, qty: 1 })
      .expect(201)

    expect(addToCartResponse.body.success).toBe(true)
    const cartItemId = addToCartResponse.body.data.id

    const cartInDb = await pool.query('SELECT * FROM carts WHERE user_id = $1', [createdUserId])

    expect(cartInDb.rows.length).toBe(1)
    const cartId = cartInDb.rows[0].id

    const cartItemInDb = await pool.query('SELECT * FROM cart_items WHERE id = $1', [cartItemId])

    expect(cartItemInDb.rows.length).toBe(1)
    expect(cartItemInDb.rows[0].cart_id).toBe(cartId)
    expect(cartItemInDb.rows[0].product_id).toBe(productId)

    const checkoutResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ address_text: '123 Test St, Test City' })
      .expect(201)

    expect(checkoutResponse.body.success).toBe(true)
    const orderId = checkoutResponse.body.data.id

    const orderInDb = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId])

    expect(orderInDb.rows.length).toBe(1)
    expect(orderInDb.rows[0].user_id).toBe(createdUserId)

    const orderItemInDb = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId])

    expect(orderItemInDb.rows.length).toBe(1)
    expect(orderItemInDb.rows[0].product_id).toBe(productId)

    const cartItemsAfterCheckout = await pool.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId])

    expect(cartItemsAfterCheckout.rows.length).toBe(0)

    const productAfterCheckout = await pool.query('SELECT * FROM products WHERE id = $1', [productId])

    expect(productAfterCheckout.rows[0].stock).toBe(initialStock - 1)
  })
})
