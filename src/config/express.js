const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const passport = require('passport')
const error = require('../api/middlewares/error')

module.exports = ({ strategies, routes }) => {
  const app = express()

  // parse body params and attache them to req.body
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(cookieParser())

  // secure apps by setting various HTTP headers
  app.use(helmet())

  app.use(passport.initialize())

  if (strategies) {
    passport.use('jwt', strategies.jwt)
    passport.use('facebook', strategies.facebook)
    passport.use('google', strategies.google)
  }

  app.use('/', routes)

  // if error is not an instanceOf APIError, convert it.
  app.use(error.converter)

  // catch 404 and forward to error handler
  app.use(error.notFound)

  // error handler, send stacktrace only during development
  app.use(error.handler)

  return app
}
