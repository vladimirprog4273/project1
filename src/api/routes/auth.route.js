const express = require('express')
const validate = require('../middlewares/validation')
const { register, login, confirm } = require('../validations/auth.validation')

module.exports = ({ authController }) => {
  const router = express.Router()

  router.post('/register', validate(register), authController.register)
  router.post('/login', validate(login), authController.login)
  router.post('/confirm', validate(confirm), authController.confirm)

  return router
}
