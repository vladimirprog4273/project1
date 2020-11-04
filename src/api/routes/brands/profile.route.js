const express = require('express')
const validate = require('../../middlewares/validation')
const { profile } = require('../../validations/brands/profile.validation')

module.exports = ({ authorize, profileController }) => {
  const router = express.Router()

  router.post('/', authorize('brand'), validate(profile), profileController.addProfile)

  return router
}
