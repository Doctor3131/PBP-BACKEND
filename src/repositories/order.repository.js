const pool = require('../../utils/config/database')

const findByUserId = async (userId, status, pagination) => {
  let query = `
    SELECT o.*, 
           (SELECT json_agg(json_build_object(
             'id', oi.id,

             'product_id', oi.product_id,
             'product_name', p.name,
             'price', oi.price,

             'qty', oi.qty,
             'subtotal', oi.subtotal
           ))
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = o.id) as items

    FROM orders o

    WHERE o.user_id = $1
  `

  const params = [userId]
  let paramCount = 1

  if (status) {
    paramCount++
    query += ` AND o.status = $${paramCount}`
    params.push(status)
  }

  query += ' ORDER BY o.created_at DESC'

  if (pagination.limit) {
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(pagination.limit)
  }

  if (pagination.offset) {
    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(pagination.offset)
  }

  const result = await pool.query(query, params)

  return result.rows
}

const countByUserId = async (userId, status) => {
  let query = 'SELECT COUNT(*) FROM orders WHERE user_id = $1'
  const params = [userId]

  if (status) {
    query += ' AND status = $2'
    params.push(status)
  }

  const result = await pool.query(query, params)

  return parseInt(result.rows[0].count)
}

const findAll = async (filters, pagination) => {
  let query = 'SELECT * FROM orders WHERE 1=1'
  const params = []
  let paramCount = 0

  if (filters.status) {
    paramCount++
    query += ` AND status = $${paramCount}`
    params.push(filters.status)
  }

  if (filters.user_id) {
    paramCount++
    query += ` AND user_id = $${paramCount}`
    params.push(filters.user_id)
  }

  query += ' ORDER BY created_at DESC'

  if (pagination.limit) {
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(pagination.limit)
  }

  if (pagination.offset) {
    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(pagination.offset)
  }

  const result = await pool.query(query, params)

  return result.rows
}

const countAll = async (filters) => {
  let query = 'SELECT COUNT(*) FROM orders WHERE 1=1'

  const params = []
  let paramCount = 0

  if (filters.status) {
    paramCount++
    query += ` AND status = $${paramCount}`
    params.push(filters.status)
  }

  if (filters.user_id) {

    paramCount++
    query += ` AND user_id = $${paramCount}`
    params.push(filters.user_id)
  }

  const result = await pool.query(query, params)

  return parseInt(result.rows[0].count)
}

const findById = async (orderId) => {

  const query = 'SELECT * FROM orders WHERE id = $1'

  const result = await pool.query(query, [orderId])

  return result.rows[0] || null
}

const getOrderItems = async (orderId) => {
  const query = `
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
  `
  const result = await pool.query(query, [orderId])

  return result.rows
}

const create = async (orderData, client = pool) => {
  const query = `
    INSERT INTO orders (user_id, total, status, address_text)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `
  const result = await client.query(query, [
    orderData.user_id,
    orderData.total,
    orderData.status,
    orderData.address_text,
  ])

  return result.rows[0]
}

const createOrderItem = async (orderId, itemData, client = pool) => {
  const query = `

    INSERT INTO order_items (order_id, product_id, price, qty, subtotal)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `
  const result = await client.query(query, [
    orderId,
    itemData.product_id,

    itemData.price,
    itemData.qty,
    itemData.subtotal,
  ])

  return result.rows[0]
}

const updateStatus = async (orderId, status, client = pool) => {
  const query = `
    UPDATE orders 
    SET status = $1
    WHERE id = $2
    RETURNING *
  `
  const result = await client.query(query, [status, orderId])

  return result.rows[0]
}

const getDashboardStats = async () => {
  const statsQuery = `
    SELECT 

      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'Cancelled') as total_revenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'Pending') as pending_orders,
      (SELECT COUNT(*) FROM products) as total_products,
      (SELECT COUNT(*) FROM products WHERE stock < 10) as low_stock_products,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_users
  `
  const result = await pool.query(statsQuery)

  return result.rows[0]
}

module.exports = {
  findByUserId,
  countByUserId,
  findAll,
  countAll,
  findById,
  getOrderItems,
  create,
  createOrderItem,
  updateStatus,
  getDashboardStats,
}
