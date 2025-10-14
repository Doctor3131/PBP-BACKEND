const express = require('express').Router()

const appRouter = express()

const authRoutes = require('./auth.routes')
// const productRoutes = require('./product.routes')
// const categoryRoutes = require('./category.routes')
// const cartRoutes = require('./cart.routes')
// const orderRoutes = require('./order.routes')
// const adminRoutes = require('./admin.routes')

appRouter.use('/auth', authRoutes)
// appRouter.use('/products', productRoutes)
// appRouter.use('/categories', categoryRoutes)
// appRouter.use('/cart', cartRoutes)
// appRouter.use('/orders', orderRoutes)
// appRouter.use('/admin', adminRoutes)

module.exports = appRouter
