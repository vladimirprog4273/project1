const { Joi } = require('express-validation')
const objectId = require('joi-objectid')(Joi)
const { stockTypes } = require('../../models/product')

module.exports = {
  // POST /product
  product: {
    body: Joi.object({
      name: Joi.string()
        .required(),
      price: Joi.number()
        .required()
        .min(0.01),
      description: Joi.string()
        .required()
        .max(200),
    }),
  },

  // GET /product/:id
  getProduct: {
    params: Joi.object({
      id: objectId().required(),
    }),
  },

  // GET /product
  listProducts: {
    query: Joi.object({
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
    }),
  },

  // PATCH /product/:id
  editStock: {
    params: Joi.object({
      id: objectId().required(),
    }),

    body: Joi.object({
      type: Joi.string()
        .valid(...stockTypes),
      sizes: Joi.string()
        .when('type', {
          is: Joi.string().required(),
          then: Joi.string().required(),
        }),
      outOfStock: Joi.boolean(),
    }),
  },
}
