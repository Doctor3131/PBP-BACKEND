const request = require('supertest')
const app = require('../../src/app')
const pool = require('../../utils/config/database')
const runIntegratedSeed = require('../../database/seeds/runIntegratedSeed')
const resetDb = require('../../utils/resetDb')

describe('Comprehensive E-commerce User Flow', () => {
  let customerToken
  let createdUserId
  let productId
  let initialStock
  let cartId
  let orderId

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
    await resetDb()
    await pool.end()
  })

  test('Step 1: should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(customerDetails)
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.user).toBeDefined()
    expect(res.body.data.token).toBeDefined()

    createdUserId = res.body.data.user.id

    const userInDb = await pool.query('SELECT * FROM users WHERE id = $1', [createdUserId])

    expect(userInDb.rows.length).toBe(1)
    expect(userInDb.rows[0].email).toBe(customerDetails.email)
  })

  test('Step 2: should log in the newly registered user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: customerDetails.email,
        password: customerDetails.password,
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()

    customerToken = res.body.data.token
  })

  test('Step 3: should add a product to the cart', async () => {
    const productsRes = await request(app)
      .get('/api/v1/products')
      .expect(200)

    expect(productsRes.body.data.length).toBeGreaterThan(0)
    productId = productsRes.body.data[0].id
    initialStock = productsRes.body.data[0].stock

    const addToCartRes = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ product_id: productId, qty: 1 })
      .expect(201)

    expect(addToCartRes.body.success).toBe(true)
    const cartItemId = addToCartRes.body.data.id

    const cartInDb = await pool.query('SELECT * FROM carts WHERE user_id = $1', [createdUserId])

    expect(cartInDb.rows.length).toBe(1)
    cartId = cartInDb.rows[0].id

    const cartItemInDb = await pool.query('SELECT * FROM cart_items WHERE id = $1', [cartItemId])

    expect(cartItemInDb.rows.length).toBe(1)
    expect(cartItemInDb.rows[0].cart_id).toBe(cartId)
    expect(cartItemInDb.rows[0].product_id).toBe(productId)
  })

  test('Step 4: should create an order from the cart (checkout)', async () => {
    const checkoutRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ address_text: '123 Test St, Test City' })
      .expect(201)

    expect(checkoutRes.body.success).toBe(true)
    expect(checkoutRes.body.message).toBe('Order created successfully')
    orderId = checkoutRes.body.data.id

    const orderInDb = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId])

    expect(orderInDb.rows.length).toBe(1)
    expect(orderInDb.rows[0].user_id).toBe(createdUserId)

    const orderItemInDb = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId])

    expect(orderItemInDb.rows.length).toBe(1)
    expect(orderItemInDb.rows[0].product_id).toBe(productId)
  })

  test('Step 5: should verify the cart is empty after checkout', async () => {
    const cartItemsAfterCheckout = await pool.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId])

    expect(cartItemsAfterCheckout.rows.length).toBe(0)
  })

  test('Step 6: should decrement the product stock after an order is created', async () => {
    const productAfterCheckout = await pool.query('SELECT stock FROM products WHERE id = $1', [productId])

    expect(productAfterCheckout.rows[0].stock).toBe(initialStock - 1)
  })
})
