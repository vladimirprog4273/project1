const express = require('express')

module.exports = ({ auth, brands, pickers } = {}) => {
  const router = express.Router()

  router.get('/status', (req, res) => res.send('OK'))

  Object.entries({ auth, brands, pickers }).forEach(([path, route]) => {
    if (route) {
      router.use(`/${path}`, route)
    }
  })

  return router
}
