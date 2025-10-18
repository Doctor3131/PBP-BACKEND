const fs = require('fs/promises')
const path = require('path')
const pool = require('../../utils/config/database')
const logger = require('../../utils/logger')
const bcrypt = require('bcrypt')
const { USERS, PRODUCTS } = require('./keyboardSeedData')

const SALT_ROUNDS = 10
const SEED_DIR = path.join(__dirname)
const SQL_SEED_FILES = [
  'users.seed.sql',
  'categories.seed.sql',
  'products.seed.sql',
]

const seedSqlFile = async (client, fileName) => {
  const filePath = path.join(SEED_DIR, fileName)
  const sql = await fs.readFile(filePath, { encoding: 'utf-8' })

  logger.info(`Executing ${fileName}...`)
  await client.query(sql)
  logger.info(`${fileName} executed successfully.`)
}

const seedSampleCart = async (client) => {
  logger.info('Seeding sample cart...')
  const userResult = await client.query(
    'SELECT id FROM users WHERE email = \'agus@example.com\'',
  )

  if (userResult.rows.length === 0) return

  const userId = userResult.rows[0].id

  const cartResult = await client.query(
    'INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = $1 RETURNING id',
    [userId],
  )

  const cartId = cartResult.rows[0].id

  const cartItems = [
    { productName: 'Bakeneko60 Hotswap Kit', qty: 1 },
    { productName: 'Gateron Oil King Linear 90pcs', qty: 1 },
    { productName: 'ePBT Retro Cyrillic', qty: 1 },
    { productName: 'Durock V2 Stabilizers Clear', qty: 1 },
    { productName: 'Krytox GPL 205g0 5ml', qty: 1 },
    { productName: 'PE Foam Sheet A4 5pcs', qty: 1 },
    { productName: 'Tokyo Night Cityscape XL', qty: 1 },
  ]

  for (const item of cartItems) {
    const productResult = await client.query(
      'SELECT id FROM products WHERE name = $1',
      [item.productName],
    )

    if (productResult.rows.length > 0) {
      await client.query(
        'INSERT INTO cart_items (cart_id, product_id, qty) VALUES ($1, $2, $3) ON CONFLICT (cart_id, product_id) DO UPDATE SET qty = $3',
        [cartId, productResult.rows[0].id, item.qty],
      )
    }
  }

  logger.info('Sample cart seeded')
}

const seedSampleOrders = async (client) => {
  logger.info('Seeding sample orders...')

  const budiResult = await client.query(
    'SELECT id FROM users WHERE email = \'budi@example.com\'',
  )

  if (budiResult.rows.length > 0) {
    const userId = budiResult.rows[0].id

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, status, address_text) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, 10730000, 'Processing', 'Jl. Gatot Subroto No. 88, Jakarta Selatan, DKI Jakarta 12930'],
    )

    const orderId = orderResult.rows[0].id

    const orderItems = [
      { name: 'GMMK Pro 75% Black', price: 3500000, qty: 1 },
      { name: 'Glorious Panda Tactile 90pcs', price: 850000, qty: 1 },
      { name: 'GMK Botanical R2', price: 3500000, qty: 1 },
      { name: 'GMK Botanical Deskmat', price: 450000, qty: 1 },
      { name: 'GMK Botanical Cable', price: 520000, qty: 1 },
      { name: 'Durock V2 Stabilizers Clear', price: 280000, qty: 1 },
      { name: 'Krytox GPL 205g0 5ml', price: 180000, qty: 1 },
      { name: 'Complete Lube Kit 205g0+105', price: 420000, qty: 1 },
      { name: 'Aluminum Lubing Station', price: 280000, qty: 1 },
      { name: 'Wrist Rest Wooden Walnut', price: 450000, qty: 1 },
      { name: 'Switch Opener Aluminum', price: 120000, qty: 1 },
      { name: 'Keycap Puller Wire', price: 45000, qty: 1 },
      { name: 'Switch Films 120pcs', price: 85000, qty: 1 },
      { name: 'PE Foam Sheet A4 5pcs', price: 85000, qty: 2 },
    ]

    for (const item of orderItems) {
      const productResult = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [item.name],
      )

      if (productResult.rows.length > 0) {
        const subtotal = item.price * item.qty

        await client.query(
          'INSERT INTO order_items (order_id, product_id, price, qty, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [orderId, productResult.rows[0].id, item.price, item.qty, subtotal],
        )
      }
    }
  }

  const citraResult = await client.query(
    'SELECT id FROM users WHERE email = \'citra@example.com\'',
  )

  if (citraResult.rows.length > 0) {
    const userId = citraResult.rows[0].id

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, status, address_text) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, 1940000, 'Shipped', 'Jl. Sudirman No. 234, Bandung, Jawa Barat 40123'],
    )

    const orderId = orderResult.rows[0].id

    const orderItems = [
      { name: 'Gateron Milky Yellow Pro 90pcs', price: 280000, qty: 3 },
      { name: 'Akko V3 Cream Yellow 90pcs', price: 320000, qty: 2 },
      { name: 'Krytox GPL 205g0 5ml', price: 180000, qty: 2 },
      { name: 'Switch Opener Aluminum', price: 120000, qty: 1 },
    ]

    for (const item of orderItems) {
      const productResult = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [item.name],
      )

      if (productResult.rows.length > 0) {
        const subtotal = item.price * item.qty

        await client.query(
          'INSERT INTO order_items (order_id, product_id, price, qty, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [orderId, productResult.rows[0].id, item.price, item.qty, subtotal],
        )
      }
    }
  }

  const daniResult = await client.query(
    'SELECT id FROM users WHERE email = \'dani@example.com\'',
  )

  if (daniResult.rows.length > 0) {
    const userId = daniResult.rows[0].id

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, status, address_text) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, 1275000, 'Completed', 'Jl. Ahmad Yani No. 156, Surabaya, Jawa Timur 60243'],
    )

    const orderId = orderResult.rows[0].id

    const orderItems = [
      { name: 'PE Foam Sheet A4 5pcs', price: 85000, qty: 3 },
      { name: 'Masking Tape Mod 3-Pack', price: 45000, qty: 5 },
      { name: 'Permatex Dielectric Grease 10g', price: 85000, qty: 2 },
      { name: 'Tokyo Night Cityscape XL', price: 520000, qty: 1 },
      { name: 'Switch Films 120pcs', price: 85000, qty: 2 },
      { name: '3D Printed Lube Station', price: 120000, qty: 1 },
      { name: 'Premium Brush Set 5pcs', price: 95000, qty: 2 },
    ]

    for (const item of orderItems) {
      const productResult = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [item.name],
      )

      if (productResult.rows.length > 0) {
        const subtotal = item.price * item.qty

        await client.query(
          'INSERT INTO order_items (order_id, product_id, price, qty, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [orderId, productResult.rows[0].id, item.price, item.qty, subtotal],
        )
      }
    }
  }

  logger.info('Sample orders seeded')
}

const runSeed = async () => {
  const client = await pool.connect()

  try {
    logger.info('')
    logger.info('-------------------------------------------')
    logger.info('KEYBOARD STORE - Database Seeding')
    logger.info('-------------------------------------------')
    logger.info('')

    await client.query('BEGIN')

    for (const fileName of SQL_SEED_FILES) {
      await seedSqlFile(client, fileName)
    }

    await seedSampleCart(client)
    await seedSampleOrders(client)

    await client.query('COMMIT')

    logger.info('')
    logger.info('-------------------------------------------')
    logger.info('Keyboard Store seeding completed!')
    logger.info('-------------------------------------------')
    logger.info('')
    logger.info('Default Credentials:')
    logger.info('  Admin: admin@keystore.com / password123')
    logger.info('  User:  agus@example.com / password123')
    logger.info('')

    const stats = await client.query(`
      SELECT 'Users' as table_name, COUNT(*) as count FROM users
      UNION ALL SELECT 'Categories', COUNT(*) FROM categories
      UNION ALL SELECT 'Products', COUNT(*) FROM products
      UNION ALL SELECT 'Carts', COUNT(*) FROM carts
      UNION ALL SELECT 'Cart Items', COUNT(*) FROM cart_items
      UNION ALL SELECT 'Orders', COUNT(*) FROM orders
      UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items
    `)

    logger.info('📊 Database Statistics:')
    stats.rows.forEach(row => {
      logger.info(`  ${row.table_name.padEnd(15)}: ${row.count}`)
    })

    const productStats = await client.query(`
      SELECT c.name as category, COUNT(p.id) as count, 
             MIN(p.price) as min_price, MAX(p.price) as max_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.name
      ORDER BY count DESC
    `)

    logger.info('')
    logger.info('Products by Category:')
    productStats.rows.forEach(row => {
      if (row.count > 0) {
        logger.info(`  ${row.category.padEnd(20)}: ${row.count} items (Rp ${(row.min_price / 1000).toFixed(0)}K - Rp ${(row.max_price / 1000).toFixed(0)}K)`)
      }
    })

    logger.info('')

  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error seeding database:', error)
    throw error
  } finally {
    client.release()
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('Seed script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Seed script failed:', error)
      process.exit(1)
    })
}

module.exports = runSeed
