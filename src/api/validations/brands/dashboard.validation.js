const { Joi } = require('express-validation')

module.exports = {
  // GET /campaigns
  campaigns: {
    query: Joi.object({
      limit: Joi.number().max(100).min(1).default(30),
      page: Joi.number().min(1).default(1),
    }),
  },
}
