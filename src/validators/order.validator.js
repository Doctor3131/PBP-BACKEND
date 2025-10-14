const Joi = require('joi')

const createOrderSchema = Joi.object({
  address_text: Joi.string().min(10).max(500).required(),
})

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled').required(),
})

module.exports = { createOrderSchema, updateOrderStatusSchema }
