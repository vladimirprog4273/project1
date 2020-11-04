const express = require('express')
const validate = require('../../middlewares/validation')
const { campaigns } = require('../../validations/brands/dashboard.validation')

module.exports = ({ authorize, dashboardController }) => {
  const router = express.Router()

  router.get('/campaigns', authorize('brand'), validate(campaigns), dashboardController.getCampaigns)

  return router
}
