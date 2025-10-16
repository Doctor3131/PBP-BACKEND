const pool = require('../../utils/config/database')

const findById = async (productId) => {
  const query = 'SELECT * FROM products WHERE id = $1'
  const result = await pool.query(query, [productId])

  return result.rows[0] || null
}

const findAll = async (filters = {}, pagination = {}) => {
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true

  `
  const params = []
  let paramCount = 0

  if (filters.search) {
    paramCount++
    query += ` AND p.name ILIKE $${paramCount}`
    params.push(`%${filters.search}%`)
  }

  if (filters.category_id) {
    paramCount++
    query += ` AND p.category_id = $${paramCount}`
    params.push(filters.category_id)
  }

  const sortMap = {

    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    name_asc: 'p.name ASC',
    name_desc: 'p.name DESC',
    newest: 'p.created_at DESC',
  }

  query += ` ORDER BY ${sortMap[filters.sort] || 'p.created_at DESC'}`

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

const count = async (filters = {}) => {
  let query = 'SELECT COUNT(*) FROM products p WHERE p.is_active = true'
  const params = []
  let paramCount = 0

  if (filters.search) {
    paramCount++
    query += ` AND p.name ILIKE $${paramCount}`
    params.push(`%${filters.search}%`)
  }

  if (filters.category_id) {
    paramCount++
    query += ` AND p.category_id = $${paramCount}`
    params.push(filters.category_id)
  }

  const result = await pool.query(query, params)

  return parseInt(result.rows[0].count)
}

const create = async (productData, client = pool) => {
  const query = `
    INSERT INTO products (name, price, stock, category_id, is_active)
    VALUES ($1, $2, $3, $4, $5)

    RETURNING *
  `
  const result = await client.query(query, [
    productData.name,
    productData.price,
    productData.stock,
    productData.category_id,

    productData.is_active ?? true,

  ])

  return result.rows[0]
}

const update = async (productId, productData, client = pool) => {
  const fields = []
  const params = []

  let paramCount = 0

  if (productData.name !== undefined) {
    paramCount++

    fields.push(`name = $${paramCount}`)
    params.push(productData.name)
  }

  if (productData.price !== undefined) {
    paramCount++
    fields.push(`price = $${paramCount}`)
    params.push(productData.price)
  }

  if (productData.stock !== undefined) {
    paramCount++
    fields.push(`stock = $${paramCount}`)
    params.push(productData.stock)
  }

  if (productData.category_id !== undefined) {

    paramCount++
    fields.push(`category_id = $${paramCount}`)

    params.push(productData.category_id)
  }

  if (productData.is_active !== undefined) {
    paramCount++
    fields.push(`is_active = $${paramCount}`)
    params.push(productData.is_active)
  }

  paramCount++
  params.push(productId)

  const query = `
    UPDATE products 
    SET ${fields.join(', ')}

    WHERE id = $${paramCount}
    RETURNING *
  `

  const result = await client.query(query, params)

  return result.rows[0]

}

const deleteById = async (productId, client = pool) => {
  const query = 'DELETE FROM products WHERE id = $1'

  await client.query(query, [productId])
}

const decrementStock = async (productId, quantity, client = pool) => {
  const query = `
    UPDATE products 
    SET stock = stock - $1

    WHERE id = $2
    RETURNING *
  `
  const result = await client.query(query, [quantity, productId])

  return result.rows[0]
}

const incrementStock = async (productId, quantity, client = pool) => {
  const query = `

    UPDATE products 
    SET stock = stock + $1
    WHERE id = $2
    RETURNING *
  `
  const result = await client.query(query, [quantity, productId])

  return result.rows[0]
}

module.exports = {
  findById,
  findAll,

  count,
  create,
  update,
  deleteById,
  decrementStock,
  incrementStock,
}
