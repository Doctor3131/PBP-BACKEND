const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cart.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { addToCartSchema, updateCartItemSchema } = require('../validators/cart.validator')

router.use(authenticate)

router.get('/', cartController.getCart)
router.post('/', validate(addToCartSchema), cartController.addToCart)
router.put('/items/:id', validate(updateCartItemSchema), cartController.updateCartItem)
router.delete('/items/:id', cartController.removeCartItem)
router.delete('/clear', cartController.clearCart)

module.exports = router
