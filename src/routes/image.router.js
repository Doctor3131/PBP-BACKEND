const express = require('express')
const router = express.Router()
const imageController = require('../controllers/image.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { isAdmin } = require('../middlewares/admin.middleware')
const { upload } = require('../middlewares/upload.middleware')

router.get('/products/:id', imageController.getProductImage)
router.get('/products/:id/:number', imageController.getProductImageByNumber)

router.post(
  '/products/:id/upload',
  authenticate,
  isAdmin,
  upload.single('image'),
  imageController.uploadProductImage,
)

router.post(
  '/products/:id/upload-multiple',
  authenticate,
  isAdmin,
  upload.array('images', 5),
  imageController.uploadMultipleProductImages,
)

router.delete(
  '/products/:id/:number?',
  authenticate,
  isAdmin,
  imageController.deleteProductImage,
)

module.exports = router
