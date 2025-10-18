const Joi = require('joi')

const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  category_id: Joi.number().integer().positive().required(),
  is_active: Joi.boolean().optional(),
})

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  price: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  category_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional(),
}).min(1)

module.exports = { createProductSchema, updateProductSchema }
