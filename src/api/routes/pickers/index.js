const express = require('express')
const validate = require('../../middlewares/validation')
const {
  campaign, brands,
} = require('../../validations/pickers/campaign.validation')

module.exports = ({ authorize, pickersController }) => {
  const router = express.Router()

  router.post('/campaign', authorize('picker'), validate(campaign), pickersController.createCampaign)
  router.get('/brands', authorize('picker'), validate(brands), pickersController.getBrandsList)

  return router
}
