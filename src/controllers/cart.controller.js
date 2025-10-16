const cartService = require('../services/cart.service')
const { successResponse } = require('../utils/response.util')

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cart = await cartService.getCartByUserId(userId)

    return successResponse(res, cart)
  } catch (error) {
    next(error)
  }
}

const addToCart = async (req, res, next) => {

  try {
    const userId = req.user.id
    const { product_id, qty } = req.body

    const cartItem = await cartService.addItemToCart(userId, product_id, qty)

    return successResponse(res, cartItem, 201, 'Item added to cart successfully')
  } catch (error) {
    next(error)
  }
}

const updateCartItem = async (req, res, next) => {

  try {
    const userId = req.user.id
    const cartItemId = parseInt(req.params.id)
    const { qty } = req.body

    const updatedItem = await cartService.updateCartItemQty(userId, cartItemId, qty)

    return successResponse(res, updatedItem, 200, 'Cart item updated successfully')
  } catch (error) {
    next(error)
  }
}

const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id
    const cartItemId = parseInt(req.params.id)

    await cartService.removeItemFromCart(userId, cartItemId)

    return successResponse(res, null, 200, 'Item removed from cart successfully')
  } catch (error) {

    next(error)
  }
}

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id

    await cartService.clearCart(userId)

    return successResponse(res, null, 200, 'Cart cleared successfully')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
}
