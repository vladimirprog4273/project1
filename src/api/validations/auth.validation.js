const { Joi } = require('express-validation')
const User = require('../models/user')

module.exports = {
  // POST /auth/register
  register: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .min(6)
        .max(128),
      role: Joi.string()
        .required()
        .valid(...User.roles),
      name: Joi.string()
        .required(),
    }),
  },

  // POST /auth/login
  login: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .max(128),
    }),
  },

  // POST /auth/confirm
  confirm: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      token: Joi.string()
        .required()
        .length(128),
    }),
  },
}
