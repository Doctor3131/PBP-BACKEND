const productRepository = require('../repositories/product.repository')
const { NotFoundError } = require('../utils/error.util')
const { buildPaginationResponse } = require('../utils/pagination.util')

const getProducts = async (filters, pagination) => {
  const products = await productRepository.findAll(filters, pagination)
  const total = await productRepository.count(filters)

  return {
    data: products,
    pagination: buildPaginationResponse(pagination.page, pagination.limit, total),
  }
}

const getProductById = async (id) => {
  const product = await productRepository.findById(id)

  if (!product) {
    throw new NotFoundError('Resource not found')
  }

  return product
}

const createProduct = async (data) => {
  const product = await productRepository.create(data)

  return product
}

const updateProduct = async (id, data) => {
  const existingProduct = await productRepository.findById(id)

  if (!existingProduct) {
    throw new NotFoundError('Resource not found')
  }

  const updatedProduct = await productRepository.update(id, data)

  return updatedProduct
}

const deleteProduct = async (id) => {
  const existingProduct = await productRepository.findById(id)

  if (!existingProduct) {
    throw new NotFoundError('Resource not found')
  }

  await productRepository.deleteById(id)
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}
