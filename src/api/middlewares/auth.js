const httpStatus = require('http-status')
const passport = require('passport')
const APIError = require('../utils/APIError')

module.exports = ({ usersRepository }) => {
  const handleJWT = (req, res, next, roles) => (err, user, info) => {
    if (err) {
      next(err)
    } else if (!user) {
      const error = err || info
      next(new APIError({
        message: error ? error.message : 'Unauthorized',
        status: httpStatus.UNAUTHORIZED,
        stack: error ? error.stack : undefined,
      }))
    } else if (!roles.includes(user.role)) {
      next(new APIError({
        status: httpStatus.FORBIDDEN,
        message: 'Forbidden',
      }))
    } else {
      req.logIn(user, (errLogIn) => {
        if (errLogIn) {
          next(errLogIn)
        } else {
          req.user = user
          next()
        }
      })
    }
  }

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    usersRepository.findById(id, (err, user) => {
      done(err, user)
    })
  })

  return roles => (req, res, next) => passport.authenticate(
    'jwt',
    handleJWT(req, res, next, roles),
  )(req, res, next)
}
