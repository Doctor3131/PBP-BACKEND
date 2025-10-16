const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { createOrderSchema } = require('../validators/order.validator')

router.use(authenticate)

router.get('/', orderController.getUserOrders)
router.get('/:id', orderController.getOrderById)
router.post('/', validate(createOrderSchema), orderController.createOrder)

module.exports = router
