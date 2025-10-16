const appRouter = require('express').Router()

const authRoutes = require('./auth.router')
const productRoutes = require('./product.router')
const categoryRoutes = require('./category.router')
const cartRoutes = require('./cart.router')
const orderRoutes = require('./order.router')
const adminRoutes = require('./admin.router')

appRouter.use('/auth', authRoutes)
appRouter.use('/products', productRoutes)
appRouter.use('/categories', categoryRoutes)
appRouter.use('/cart', cartRoutes)
appRouter.use('/orders', orderRoutes)
appRouter.use('/admin', adminRoutes)

module.exports = appRouter
