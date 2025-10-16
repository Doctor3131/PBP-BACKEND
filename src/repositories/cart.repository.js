const pool = require('../../utils/config/database')

const findByUserId = async (userId) => {
  const query = 'SELECT * FROM carts WHERE user_id = $1'
  const result = await pool.query(query, [userId])

  return result.rows[0] || null
}

const create = async (userId) => {
  const query = `
    INSERT INTO carts (user_id)
    VALUES ($1)
    RETURNING *
  `
  const result = await pool.query(query, [userId])

  return result.rows[0]

}

const getCartItems = async (cartId) => {
  const query = `

    SELECT 
      ci.id,
      ci.cart_id,

      ci.product_id,

      p.name as product_name,
      p.price,
      ci.qty,
      (p.price * ci.qty) as subtotal,
      p.stock as available_stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1 AND p.is_active = true
    ORDER BY ci.id DESC
  `
  const result = await pool.query(query, [cartId])

  return result.rows
}

const findCartItem = async (cartId, productId) => {
  const query = `

    SELECT * FROM cart_items 
    WHERE cart_id = $1 AND product_id = $2
  `
  const result = await pool.query(query, [cartId, productId])

  return result.rows[0] || null
}

const findCartItemById = async (cartItemId) => {
  const query = 'SELECT * FROM cart_items WHERE id = $1'
  const result = await pool.query(query, [cartItemId])

  return result.rows[0] || null
}

const getCartItemWithDetails = async (cartItemId) => {
  const query = `
    SELECT 
      ci.id,
      ci.cart_id,
      ci.product_id,
      p.name as product_name,
      p.price,
      ci.qty,
      (p.price * ci.qty) as subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.id = $1
  `
  const result = await pool.query(query, [cartItemId])

  return result.rows[0] || null
}

const addCartItem = async (cartId, productId, qty) => {
  const query = `
    INSERT INTO cart_items (cart_id, product_id, qty)
    VALUES ($1, $2, $3)
    RETURNING *
  `
  const result = await pool.query(query, [cartId, productId, qty])

  return result.rows[0]
}

const updateCartItemQty = async (cartItemId, qty) => {
  const query = `
    UPDATE cart_items 
    SET qty = $1
    WHERE id = $2
    RETURNING *
  `
  const result = await pool.query(query, [qty, cartItemId])

  return result.rows[0]
}

const deleteCartItem = async (cartItemId) => {
  const query = 'DELETE FROM cart_items WHERE id = $1'

  await pool.query(query, [cartItemId])
}

const clearCartItems = async (cartId) => {
  const query = 'DELETE FROM cart_items WHERE cart_id = $1'

  await pool.query(query, [cartId])
}

const getCartItemsCount = async (cartId) => {
  const query = 'SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1'
  const result = await pool.query(query, [cartId])

  return parseInt(result.rows[0].count)
}

module.exports = {
  findByUserId,
  create,
  getCartItems,
  findCartItem,
  findCartItemById,
  getCartItemWithDetails,
  addCartItem,
  updateCartItemQty,
  deleteCartItem,
  clearCartItems,

  getCartItemsCount,
}
