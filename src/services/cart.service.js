const cartRepository = require('../repositories/cart.repository')
const productRepository = require('../repositories/product.repository')
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/error.util')

const getCartByUserId = async (userId) => {
  let cart = await cartRepository.findByUserId(userId)

  if (!cart) {
    cart = await cartRepository.create(userId)
  }

  const items = await cartRepository.getCartItems(cart.id)

  const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)

  return {
    cart_id: cart.id,
    items,
    total: total.toFixed(2),
  }
}

const addItemToCart = async (userId, productId, qty) => {

  const product = await productRepository.findById(productId)

  if (!product) {
    throw new NotFoundError('Product not found')
  }

  if (!product.is_active) {
    throw new BadRequestError('Product is not available')
  }

  if (product.stock < qty) {
    throw new BadRequestError(`Insufficient stock. Available: ${product.stock}`)
  }

  let cart = await cartRepository.findByUserId(userId)

  if (!cart) {
    cart = await cartRepository.create(userId)

  }

  const existingItem = await cartRepository.findCartItem(cart.id, productId)

  if (existingItem) {
    const newQty = existingItem.qty + qty

    if (product.stock < newQty) {
      throw new BadRequestError(`Insufficient stock. Available: ${product.stock}, Current in cart: ${existingItem.qty}`)

    }

    const updatedItem = await cartRepository.updateCartItemQty(existingItem.id, newQty)

    return await cartRepository.getCartItemWithDetails(updatedItem.id)
  } else {
    const cartItem = await cartRepository.addCartItem(cart.id, productId, qty)

    return await cartRepository.getCartItemWithDetails(cartItem.id)
  }
}

const updateCartItemQty = async (userId, cartItemId, newQty) => {
  const cartItem = await cartRepository.getCartItemWithDetails(cartItemId)

  if (!cartItem) {
    throw new NotFoundError('Cart item not found')
  }

  const cart = await cartRepository.findByUserId(userId)

  if (cartItem.cart_id !== cart.id) {
    throw new NotFoundError('Cart item not found')

  }

  const product = await productRepository.findById(cartItem.product_id)

  if (product.stock < newQty) {
    throw new BadRequestError(`Insufficient stock. Available: ${product.stock}`)

  }

  await cartRepository.updateCartItemQty(cartItemId, newQty)

  return await cartRepository.getCartItemWithDetails(cartItemId)
}

const removeItemFromCart = async (userId, cartItemId) => {
  const cart = await cartRepository.findByUserId(userId)
  const cartItem = await cartRepository.findCartItemById(cartItemId)

  if (!cartItem || cartItem.cart_id !== cart.id) {
    throw new NotFoundError('Cart item not found')
  }

  await cartRepository.deleteCartItem(cartItemId)
}

const clearCart = async (userId) => {
  const cart = await cartRepository.findByUserId(userId)

  if (cart) {
    await cartRepository.clearCartItems(cart.id)
  }
}

module.exports = {

  getCartByUserId,
  addItemToCart,
  updateCartItemQty,
  removeItemFromCart,
  clearCart,
}
