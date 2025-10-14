const pool = require('../../utils/config/database')
const logger = require('../../utils/logger')
const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10

const USERS = [
  { name: 'Admin KeyStore', email: 'admin@keystore.com', role: 'admin' },
  { name: 'Agus Keyboard', email: 'agus@example.com', role: 'customer' },
  { name: 'Budi Enthusiast', email: 'budi@example.com', role: 'customer' },
  { name: 'Citra Builder', email: 'citra@example.com', role: 'customer' },
  { name: 'Dani Modder', email: 'dani@example.com', role: 'customer' },
]

const CATEGORIES = [
  'Keyboards',
  'Switches',
  'Keycaps',
  'PCB',
  'Dampeners',
  'Lubricants',
  'Plates',
  'Desk Mats',
  'Stabilizers',
  'Cables',
  'Tools & Accessories',
]

const PRODUCTS = {
  keyboards: [
    { name: 'GMMK Pro 75% Black', price: 3500000, stock: 15 },
    { name: 'Keychron Q1 Pro QMK/VIA', price: 2800000, stock: 20 },
    { name: 'Mode SixtyFive Custom', price: 5500000, stock: 8 },
    { name: 'Zoom65 Essential Edition', price: 2200000, stock: 25 },
    { name: 'NK65 Entry Edition Smoke', price: 1800000, stock: 30 },
    { name: 'Tofu60 Acrylic Case Kit', price: 1500000, stock: 18 },
    { name: 'KBD67 Lite R4 Wireless', price: 1900000, stock: 22 },
    { name: 'Bakeneko60 Hotswap Kit', price: 950000, stock: 35 },
    { name: 'Tiger Lite 80 TKL Kit', price: 2400000, stock: 12 },
    { name: 'Ikki68 Aurora R2 Charcoal', price: 3200000, stock: 10 },
    { name: 'Royal Kludge RK84 Hotswap', price: 850000, stock: 40 },
    { name: 'Keychron K8 Pro Brown', price: 1650000, stock: 28 },
    { name: 'Womier K87 Gasket Mount', price: 950000, stock: 32 },
  ],

  switches: [
    // Linear
    { name: 'Gateron Oil King Linear 90pcs', price: 650000, stock: 50 },
    { name: 'Cherry MX Black Hyperglide 90pcs', price: 750000, stock: 45 },
    { name: 'Gateron Milky Yellow Pro 90pcs', price: 280000, stock: 80 },
    { name: 'Akko V3 Cream Yellow 90pcs', price: 320000, stock: 70 },
    { name: 'Gateron CJ Linear 90pcs', price: 580000, stock: 55 },
    { name: 'JWK Durock L7 Linear 90pcs', price: 720000, stock: 40 },
    // Tactile
    { name: 'Glorious Panda Tactile 90pcs', price: 850000, stock: 35 },
    { name: 'Durock T1 Tactile 90pcs', price: 620000, stock: 48 },
    { name: 'Akko V3 Lavender Purple 90pcs', price: 340000, stock: 65 },
    { name: 'Boba U4T Tactile 90pcs', price: 780000, stock: 42 },
    { name: 'Gateron Brown Pro 90pcs', price: 380000, stock: 75 },
    // Clicky
    { name: 'Kailh Box White Clicky 90pcs', price: 420000, stock: 30 },
    { name: 'Cherry MX Blue 90pcs', price: 680000, stock: 25 },
    { name: 'Gateron Blue Pro 90pcs', price: 350000, stock: 45 },
    // Silent
    { name: 'Gateron Silent Black 90pcs', price: 480000, stock: 38 },
    { name: 'Cherry MX Silent Red 90pcs', price: 820000, stock: 28 },
    { name: 'Boba U4 Silent Tactile 90pcs', price: 750000, stock: 32 },
  ],

  keycaps: [
    // PBT Keycaps
    { name: 'GMK Shoko Clone PBT', price: 450000, stock: 35 },
    { name: 'ePBT Retro Cyrillic', price: 1200000, stock: 20 },
    { name: 'Akko ASA Black Pink', price: 380000, stock: 55 },
    { name: 'NicePBT Sugarplum', price: 850000, stock: 28 },
    { name: 'Domikey Cyberpunk Pumper', price: 950000, stock: 22 },
    // ABS Premium
    { name: 'GMK Botanical R2', price: 3500000, stock: 8 },
    { name: 'GMK Olivia++ Light', price: 4200000, stock: 5 },
    { name: 'GMK Red Samurai', price: 2800000, stock: 10 },
    { name: 'GMK Modern Dolch', price: 3200000, stock: 7 },
    // Budget
    { name: 'HyperX Pudding PBT White', price: 350000, stock: 60 },
    { name: 'Ducky Seamless PBT Black', price: 480000, stock: 45 },
    { name: 'XDA Canvas PBT', price: 420000, stock: 50 },
    { name: 'Cherry Profile Matcha', price: 380000, stock: 55 },
    // Artisan
    { name: 'Jelly Key Zen Pond III Koi', price: 850000, stock: 12 },
    { name: 'Tiny Artisan Dragon Gold', price: 650000, stock: 15 },
    { name: 'Alpha Keycaps Salvador Blinks', price: 1200000, stock: 8 },
  ],

  pcb: [
    // Hotswap
    { name: 'DZ60RGB V3 Hotswap PCB', price: 850000, stock: 25 },
    { name: 'BM65 RGB ISO Hotswap PCB', price: 650000, stock: 30 },
    { name: 'WT60-D Hotswap PCB', price: 1200000, stock: 18 },
    { name: 'GK61 Hotswap PCB', price: 380000, stock: 45 },
    { name: 'Bakeneko65 Hotswap PCB', price: 750000, stock: 22 },
    // Soldered
    { name: 'DZ60 Rev3 Solder PCB', price: 650000, stock: 28 },
    { name: 'GH60 Satan PCB', price: 450000, stock: 35 },
    { name: 'WT80-A TKL Solder PCB', price: 1350000, stock: 15 },
    // Premium
    { name: 'Wilba Tech WT60-H2 QMK', price: 1800000, stock: 12 },
    { name: 'Sneakbox Alice QMK PCB', price: 1500000, stock: 10 },
  ],

  dampeners: [
    { name: 'StupidFish Design Foam Kit', price: 180000, stock: 50 },
    { name: 'PE Foam Sheet A4 5pcs', price: 85000, stock: 80 },
    { name: 'Poron Foam Sheet 2mm', price: 120000, stock: 65 },
    { name: 'IXPE Switch Foam 120pcs', price: 95000, stock: 70 },
    { name: 'Masking Tape Mod 3-Pack', price: 45000, stock: 100 },
    { name: 'Sorbothane Dampening Sheet', price: 280000, stock: 35 },
    { name: 'Neoprene Foam Roll 50cm', price: 150000, stock: 45 },
    { name: 'KBDfans Tofu60 Foam Kit', price: 220000, stock: 40 },
    { name: 'Mode65 Silicone Dampener', price: 320000, stock: 25 },
    { name: 'Custom Cut Case Foam', price: 180000, stock: 38 },
  ],

  lubricants: [
    { name: 'Krytox GPL 205g0 5ml', price: 180000, stock: 60 },
    { name: 'Krytox GPL 105 Oil 5ml', price: 150000, stock: 55 },
    { name: 'Tribosys 3203 5ml', price: 165000, stock: 50 },
    { name: 'Tribosys 3204 5ml', price: 175000, stock: 48 },
    { name: 'Super Lube Silicone 5ml', price: 95000, stock: 70 },
    { name: 'Permatex Dielectric Grease 10g', price: 85000, stock: 80 },
    { name: 'Krytox GPL 205g0 10g Premium', price: 320000, stock: 35 },
    { name: 'XHT-BDZ Stabilizer Lube 5g', price: 125000, stock: 45 },
    { name: 'Complete Lube Kit 205g0+105', price: 420000, stock: 30 },
    { name: 'Starter Lube Bundle', price: 280000, stock: 42 },
  ],

  plates: [
    { name: 'DZ60 Aluminum Plate Black', price: 320000, stock: 35 },
    { name: 'Tofu60 Brass Plate', price: 580000, stock: 22 },
    { name: 'GK61 FR4 Plate', price: 180000, stock: 45 },
    { name: 'Universal 60% Carbon Fiber', price: 650000, stock: 18 },
    { name: 'TKL Aluminum Plate ANSI', price: 420000, stock: 28 },
    { name: 'TKL Polycarbonate Plate', price: 380000, stock: 30 },
    { name: 'TKL Brass Plate Premium', price: 720000, stock: 15 },
    { name: 'KBD67 Aluminum Plate', price: 350000, stock: 32 },
    { name: 'GMMK Pro FR4 Plate', price: 280000, stock: 38 },
    { name: 'Mode65 POM Plate', price: 450000, stock: 20 },
    { name: 'Acrylic Plate 60% Clear', price: 220000, stock: 40 },
    { name: 'Copper Plate 60% Limited', price: 950000, stock: 8 },
  ],

  deskMats: [
    { name: 'GMK Botanical Deskmat', price: 450000, stock: 40 },
    { name: 'Minimal Wave Deskmat Black', price: 280000, stock: 60 },
    { name: 'Pixel Art Cyberpunk', price: 320000, stock: 55 },
    { name: 'Olivia++ Dark Deskmat', price: 480000, stock: 35 },
    { name: 'Samurai Rising Sun', price: 350000, stock: 48 },
    { name: 'RGB Extended Gaming Mat', price: 420000, stock: 42 },
    { name: 'Minimalist Grey XL', price: 380000, stock: 50 },
    { name: 'Tokyo Night Cityscape XL', price: 520000, stock: 30 },
    { name: 'Mecha-01 Deskmat', price: 350000, stock: 45 },
    { name: 'Retro Wave Synthwave', price: 380000, stock: 40 },
    { name: 'Cherry Blossom Sakura', price: 420000, stock: 38 },
    { name: 'Matrix Code Green', price: 320000, stock: 52 },
    { name: 'Leather Deskmat Brown', price: 850000, stock: 15 },
    { name: 'Wool Felt Deskmat Grey', price: 650000, stock: 20 },
  ],

  stabilizers: [
    { name: 'Durock V2 Stabilizers Clear', price: 280000, stock: 50 },
    { name: 'Cherry Clip-in Stabilizers', price: 180000, stock: 60 },
    { name: 'TX Stabilizers V3', price: 420000, stock: 35 },
    { name: 'Staebies Screw-in Black', price: 380000, stock: 40 },
    { name: 'C3 Equalz Stabilizers', price: 320000, stock: 45 },
    { name: 'Durock V2 Smokey 60% Kit', price: 250000, stock: 42 },
    { name: 'Zeal Gold Plated Stabs', price: 580000, stock: 25 },
    { name: 'Everglide Panda Stabilizers', price: 320000, stock: 38 },
  ],

  cables: [
    { name: 'Custom Coiled USB-C Black', price: 350000, stock: 30 },
    { name: 'Aviator Cable Navy Blue', price: 420000, stock: 25 },
    { name: 'Pastel Pink Coiled Cable', price: 380000, stock: 28 },
    { name: 'GMK Botanical Cable', price: 520000, stock: 18 },
    { name: 'Samurai Red Aviator', price: 450000, stock: 22 },
    { name: 'Braided USB-C Cable 2m', price: 150000, stock: 60 },
    { name: 'Paracord USB-C White', price: 180000, stock: 55 },
    { name: 'Premium USB-A to C Black', price: 120000, stock: 70 },
  ],

  tools: [
    { name: 'Switch Opener Aluminum', price: 120000, stock: 80 },
    { name: 'Keycap Puller Wire', price: 45000, stock: 120 },
    { name: 'Switch Puller Tool', price: 55000, stock: 110 },
    { name: 'Precision Screwdriver Set', price: 180000, stock: 50 },
    { name: 'Switch Opener 2-in-1', price: 150000, stock: 65 },
    { name: 'Aluminum Lubing Station', price: 280000, stock: 35 },
    { name: '3D Printed Lube Station', price: 120000, stock: 45 },
    { name: 'Premium Brush Set 5pcs', price: 95000, stock: 60 },
    { name: 'Switch Films 120pcs', price: 85000, stock: 70 },
    { name: 'Switch Tester 25 Switches', price: 380000, stock: 25 },
    { name: 'Switch Tester 9 Popular', price: 180000, stock: 40 },
    { name: 'Acrylic Keyboard Stand', price: 220000, stock: 30 },
    { name: 'Wrist Rest Wooden Walnut', price: 450000, stock: 22 },
    { name: 'Wrist Rest Memory Foam', price: 280000, stock: 38 },
  ],
}

const seedUsers = async (client) => {
  logger.info('Seeding users...')
  const password = await bcrypt.hash('password123', SALT_ROUNDS)

  for (const user of USERS) {
    await client.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [user.name, user.email, password, user.role],
    )
  }

  logger.info(`✓ ${USERS.length} users seeded`)
}

const seedCategories = async (client) => {
  logger.info('Seeding categories...')

  for (const category of CATEGORIES) {
    await client.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [category],
    )
  }

  logger.info(`✓ ${CATEGORIES.length} categories seeded`)
}

const seedProducts = async (client) => {
  logger.info('Seeding products...')

  const categoryMap = {
    keyboards: 1,
    switches: 2,
    keycaps: 3,
    pcb: 4,
    dampeners: 5,
    lubricants: 6,
    plates: 7,
    deskMats: 8,
    stabilizers: 9,
    cables: 10,
    tools: 11,
  }

  let totalProducts = 0

  for (const [category, products] of Object.entries(PRODUCTS)) {
    const categoryId = categoryMap[category]

    for (const product of products) {
      await client.query(
        'INSERT INTO products (name, price, stock, category_id, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING',
        [product.name, product.price, product.stock, categoryId, true],
      )
      totalProducts++
    }
  }

  logger.info(`✓ ${totalProducts} products seeded`)
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

  logger.info('✓ Sample cart seeded')
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

  logger.info('✓ Sample orders seeded')
}

const runKeyboardSeed = async () => {
  const client = await pool.connect()

  try {
    logger.info('')
    logger.info('════════════════════════════════════════════')
    logger.info('🎹 KEYBOARD STORE - Database Seeding')
    logger.info('════════════════════════════════════════════')
    logger.info('')

    await client.query('BEGIN')

    await seedUsers(client)
    await seedCategories(client)
    await seedProducts(client)
    await seedSampleCart(client)
    await seedSampleOrders(client)

    await client.query('COMMIT')

    logger.info('')
    logger.info('════════════════════════════════════════════')
    logger.info('✓ Keyboard Store seeding completed!')
    logger.info('════════════════════════════════════════════')
    logger.info('')
    logger.info('🔑 Default Credentials:')
    logger.info('  Admin: admin@keystore.com / password123')
    logger.info('  User:  agus@example.com / password123')
    logger.info('')

    // Statistics
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

    // Product breakdown
    const productStats = await client.query(`
      SELECT c.name as category, COUNT(p.id) as count, 
             MIN(p.price) as min_price, MAX(p.price) as max_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.name
      ORDER BY count DESC
    `)

    logger.info('')
    logger.info('📦 Products by Category:')
    productStats.rows.forEach(row => {
      if (row.count > 0) {
        logger.info(`  ${row.category.padEnd(20)}: ${row.count} items (Rp ${(row.min_price / 1000).toFixed(0)}K - Rp ${(row.max_price / 1000).toFixed(0)}K)`)
      }
    })

    logger.info('')

  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('❌ Error seeding database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

if (require.main === module) {
  runKeyboardSeed()
    .then(() => {
      logger.info('✓ Seed script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('❌ Seed script failed:', error)
      process.exit(1)
    })
}

module.exports = runKeyboardSeed
