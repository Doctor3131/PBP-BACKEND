const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { isAdmin } = require('../middlewares/admin.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { updateOrderStatusSchema } = require('../validators/order.validator')

router.use(authenticate)
router.use(isAdmin)
router.get('/orders', adminController.getAllOrders)

router.get('/orders/:id', adminController.getOrderById)
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus)
router.get('/dashboard', adminController.getDashboardStats)

module.exports = router
