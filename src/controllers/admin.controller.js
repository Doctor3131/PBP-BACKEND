const orderService = require('../services/order.service')
const productService = require('../services/product.service')
const { successResponse } = require('../utils/response.util')
const { getPaginationParams } = require('../utils/pagination.util')

const getAllOrders = async (req, res, next) => {
  try {
    const { status, user_id } = req.query
    const pagination = getPaginationParams(req.query)

    const result = await orderService.getAllOrders({ status, user_id }, pagination)

    return successResponse(res, result)
  } catch (error) {
    next(error)
  }
}

const getOrderById = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id)

    const order = await orderService.getOrderById(orderId, null)

    return successResponse(res, order)
  } catch (error) {
    next(error)
  }
}

const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id)
    const { status } = req.body

    const order = await orderService.updateOrderStatus(orderId, status)

    return successResponse(res, order, 200, 'Order status updated successfully')
  } catch (error) {
    next(error)
  }
}

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await orderService.getDashboardStats()

    return successResponse(res, stats)
  } catch (error) {
    next(error)
  }

}

module.exports = {
  getAllOrders,
  getOrderById,

  updateOrderStatus,
  getDashboardStats,
}
