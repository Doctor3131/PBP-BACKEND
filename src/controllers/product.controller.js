const productService = require('../services/product.service')
const { successResponse } = require('../utils/response.util')
const { getPaginationParams } = require('../utils/pagination.util')

const getProducts = async (req, res, next) => {
  try {
    const filters = req.query
    const pagination = getPaginationParams(req.query)

    const result = await productService.getProducts(filters, pagination)

    return successResponse(res, result.data, 200, null, result.pagination)
  } catch (error) {
    next(error)
  }
}

const getProductById = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)

    const product = await productService.getProductById(productId)

    return successResponse(res, product)
  } catch (error) {
    next(error)
  }
}

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body)

    return successResponse(res, product, 201, 'Product created successfully')
  } catch (error) {
    next(error)
  }
}

const updateProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)

    const product = await productService.updateProduct(productId, req.body)

    return successResponse(res, product, 200, 'Product updated successfully')
  } catch (error) {
    next(error)
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)

    await productService.deleteProduct(productId)

    return successResponse(res, null, 200, 'Product deleted successfully')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}
