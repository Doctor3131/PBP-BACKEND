const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/category.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { isAdmin } = require('../middlewares/admin.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { categorySchema } = require('../validators/category.validator') // Diimpor dari skema yang dibuat di bawah

router.get('/', categoryController.getAllCategories)

router.post(
  '/',
  authenticate,
  isAdmin,
  validate(categorySchema),
  categoryController.createCategory,
)

router.put(
  '/:id',
  authenticate,
  isAdmin,
  validate(categorySchema),
  categoryController.updateCategory,
)

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  categoryController.deleteCategory,
)

module.exports = router
