const JwtStrategy = require('passport-jwt').Strategy
const BearerStrategy = require('passport-http-bearer')
const { ExtractJwt } = require('passport-jwt')
const { jwtSecret } = require('./vars')
const authProviders = require('../api/services/authProviders')

module.exports = ({ usersRepository }) => {
  const jwtOptions = {
    secretOrKey: jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  }

  const jwt = async (payload, done) => {
    try {
      const user = await usersRepository.findById(payload.sub)
      if (user) return done(null, user)
      return done(null, false)
    } catch (error) {
      return done(error, false)
    }
  }

  const oAuth = service => async (token, done) => {
    try {
      const userData = await authProviders[service](token)
      const user = await usersRepository.oAuthLogin(userData)
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }

  return {
    jwt: new JwtStrategy(jwtOptions, jwt),
    facebook: new BearerStrategy(oAuth('facebook')),
    google: new BearerStrategy(oAuth('google')),
  }
}
