
const Joi = require('joi')

const addToCartSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  qty: Joi.number().integer().min(1).required(),
})

const updateCartItemSchema = Joi.object({
  qty: Joi.number().integer().min(1).required(),
})

module.exports = { addToCartSchema, updateCartItemSchema }
