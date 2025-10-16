const orderService = require('../services/order.service')
const { successResponse } = require('../utils/response.util')
const { getPaginationParams } = require('../utils/pagination.util')

const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status } = req.query
    const pagination = getPaginationParams(req.query)

    const result = await orderService.getUserOrders(userId, status, pagination)

    return successResponse(res, result)
  } catch (error) {
    next(error)
  }
}

const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const orderId = parseInt(req.params.id)

    const order = await orderService.getOrderById(orderId, userId)

    return successResponse(res, order)
  } catch (error) {
    next(error)

  }
}

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { address_text } = req.body

    const order = await orderService.createOrder(userId, address_text)

    return successResponse(res, order, 201, 'Order created successfully')

  } catch (error) {
    next(error)
  }
}

module.exports = {
  getUserOrders,
  getOrderById,
  createOrder,

}
