const categoryRepository = require('../repositories/category.repository')
const { NotFoundError } = require('../utils/error.util')

const getAllCategories = async () => {
  const categories = await categoryRepository.findAll()

  return categories
}

const createCategory = async (name) => {
  const category = await categoryRepository.create(name)

  return category
}

const updateCategory = async (id, name) => {
  const existingCategory = await categoryRepository.findById(id)

  if (!existingCategory) {
    throw new NotFoundError('Category not found')
  }

  const updatedCategory = await categoryRepository.update(id, name)

  return updatedCategory
}

const deleteCategory = async (id) => {
  const existingCategory = await categoryRepository.findById(id)

  if (!existingCategory) {
    throw new NotFoundError('Category not found')
  }

  await categoryRepository.deleteById(id)
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
}
