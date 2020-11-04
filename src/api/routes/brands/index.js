const express = require('express')

module.exports = ({ productRouter, profileRouter, dashboardRouter }) => {
  const router = express.Router()

  router.use('/product', productRouter)
  router.use('/profile', profileRouter)
  router.use('/dashboard', dashboardRouter)

  return router
}
