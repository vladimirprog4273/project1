const { Joi } = require('express-validation')
const objectId = require('joi-objectid')(Joi)

module.exports = {
  // POST /campaign
  campaign: {
    body: Joi.object({
      products: Joi.array()
        .items(objectId())
        .required(),
      brandId: objectId().required(),
    }),
  },

  // GET /brands
  brands: {
    query: Joi.object({
      limit: Joi.number().max(100).min(1).default(30),
      page: Joi.number().min(1).default(1),
    }),
  },
}
