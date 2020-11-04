const { Joi } = require('express-validation')

module.exports = {
  // POST /profile
  profile: {
    body: Joi.object({
      name: Joi.string().required(),
      country: Joi.string().required(),
      website: Joi.string().uri().required(),
      instagram: Joi.string().uri().required(),
      code: Joi.number().required(),
      phone: Joi.string().required(),
    }),
  },
}
