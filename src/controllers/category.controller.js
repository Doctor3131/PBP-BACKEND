const categoryService = require('../services/category.service')
const { successResponse } = require('../utils/response.util')

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories()

    return successResponse(res, categories)
  } catch (error) {
    next(error)
  }
}

const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body
    const category = await categoryService.createCategory(name)

    return successResponse(res, category, 201, 'Category created successfully')
  } catch (error) {
    next(error)
  }
}

const updateCategory = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id)
    const { name } = req.body
    const updatedCategory = await categoryService.updateCategory(categoryId, name)

    return successResponse(res, updatedCategory, 200, 'Category updated successfully')
  } catch (error) {
    next(error)
  }
}

const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id)

    await categoryService.deleteCategory(categoryId)

    return successResponse(res, null, 200, 'Category deleted successfully')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
}
