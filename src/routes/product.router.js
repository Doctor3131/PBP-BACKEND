const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const { validate } = require('../middlewares/validate.middleware')
const { authenticate } = require('../middlewares/auth.middleware')
const { isAdmin } = require('../middlewares/admin.middleware')
const { createProductSchema, updateProductSchema } = require('../validators/product.validator')

router.get('/', productController.getProducts)
router.get('/:id', productController.getProductById)

router.post(
  '/',
  authenticate,
  isAdmin,
  validate(createProductSchema),
  productController.createProduct,
)

router.put(
  '/:id',
  authenticate,
  isAdmin,
  validate(updateProductSchema),
  productController.updateProduct,
)

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  productController.deleteProduct,
)

module.exports = router
