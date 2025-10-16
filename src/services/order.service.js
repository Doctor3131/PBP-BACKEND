const orderRepository = require('../repositories/order.repository')
const cartRepository = require('../repositories/cart.repository')
const productRepository = require('../repositories/product.repository')
const pool = require('../../utils/config/database')
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors')
const { buildPaginationResponse } = require('../utils/pagination.util')

const getUserOrders = async (userId, status, pagination) => {
  const orders = await orderRepository.findByUserId(userId, status, pagination)
  const total = await orderRepository.countByUserId(userId, status)

  return {
    data: orders,
    pagination: buildPaginationResponse(pagination.page, pagination.limit, total),
  }
}

const getAllOrders = async (filters, pagination) => {
  const orders = await orderRepository.findAll(filters, pagination)
  const total = await orderRepository.countAll(filters)

  return {
    data: orders,
    pagination: buildPaginationResponse(pagination.page, pagination.limit, total),
  }
}

const getOrderById = async (orderId, userId = null) => {
  const order = await orderRepository.findById(orderId)

  if (!order) {
    throw new NotFoundError('Order not found')
  }

  if (userId !== null && order.user_id !== userId) {
    throw new ForbiddenError('Access denied')
  }

  const items = await orderRepository.getOrderItems(orderId)

  return {
    ...order,
    items,
  }
}

const createOrder = async (userId, addressText) => {

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const cart = await cartRepository.findByUserId(userId)

    if (!cart) {
      throw new BadRequestError('Cart is empty')
    }

    const cartItems = await cartRepository.getCartItems(cart.id)

    if (cartItems.length === 0) {
      throw new BadRequestError('Cart is empty')
    }

    let total = 0
    const orderItemsData = []

    for (const item of cartItems) {
      const product = await productRepository.findById(item.product_id)

      if (!product || !product.is_active) {
        throw new BadRequestError(`Product ${item.product_name} is not available`)
      }

      if (product.stock < item.qty) {
        throw new BadRequestError(
          `Insufficient stock for ${item.product_name}. Available: ${product.stock}, Requested: ${item.qty}`,
        )
      }

      const subtotal = product.price * item.qty

      total += subtotal

      orderItemsData.push({
        product_id: product.id,
        price: product.price,
        qty: item.qty,

        subtotal: subtotal,
      })
    }

    const order = await orderRepository.create({
      user_id: userId,
      total: total,
      status: 'Pending',
      address_text: addressText,
    }, client)

    for (const itemData of orderItemsData) {
      await orderRepository.createOrderItem(order.id, itemData, client)
      await productRepository.decrementStock(itemData.product_id, itemData.qty, client)
    }

    await cartRepository.clearCartItems(cart.id)

    await client.query('COMMIT')

    return await getOrderById(order.id)

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

}

const updateOrderStatus = async (orderId, newStatus) => {

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const order = await orderRepository.findById(orderId)

    if (!order) {
      throw new NotFoundError('Order not found')

    }

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      throw new BadRequestError(`Cannot update order with status: ${order.status}`)

    }

    if (newStatus === 'Cancelled' && order.status !== 'Cancelled') {
      const orderItems = await orderRepository.getOrderItems(orderId)

      for (const item of orderItems) {
        await productRepository.incrementStock(item.product_id, item.qty, client)
      }
    }

    await orderRepository.updateStatus(orderId, newStatus, client)

    await client.query('COMMIT')

    return await getOrderById(orderId)

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()

  }
}

const getDashboardStats = async () => {
  const stats = await orderRepository.getDashboardStats()

  return stats
}

module.exports = {
  getUserOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getDashboardStats,
}
