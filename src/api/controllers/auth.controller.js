const httpStatus = require('http-status')
const moment = require('moment-timezone')
const { jwtExpirationInterval } = require('../../config/vars')
const APIError = require('../utils/APIError')

function AuthController({ refreshTokenRepository, usersRepository, confirmTokenRepository }) {
  async function generateTokenResponse(user, accessToken) {
    const { id, email } = user

    const tokenType = 'Bearer'
    const refreshToken = await refreshTokenRepository.generate(id, email)
    const expiresIn = moment().add(jwtExpirationInterval, 'minutes')
    return {
      tokenType,
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn,
    }
  }

  const register = async (req, res, next) => {
    try {
      const passwordHash = await usersRepository.hashPassword(req.body.password)
      const { password, ...data } = req.body
      const userData = { ...data, passwordHash }

      const user = await usersRepository.create(userData)
      const token = await generateTokenResponse(user, usersRepository.token(user.id))
      res.status(httpStatus.CREATED)
      return res.json({ token, user })
    } catch (error) {
      return next(usersRepository.checkDuplicateEmail(error))
    }
  }

  const login = async (req, res, next) => {
    try {
      const { user, accessToken } = await usersRepository.findAndGenerateToken(req.body)
      const token = await generateTokenResponse(user, accessToken)
      return res.json({ token, user })
    } catch (error) {
      return next(error)
    }
  }

  const confirm = async (req, res, next) => {
    try {
      const { email, token } = req.body
      const confirmToken = await confirmTokenRepository.findAndRemove(email, token)

      if (!confirmToken) {
        next(new APIError({
          status: httpStatus.BAD_REQUEST,
          message: 'Email is no need to confirm',
        }))
      } else if (moment().isAfter(confirmToken.expires)) {
        next(new APIError({
          status: httpStatus.BAD_REQUEST,
          message: 'Confirm token is expired',
        }))
      } else {
        res.json('Email confirmed')
      }
    } catch (error) {
      next(error)
    }
  }

  return { register, login, confirm }
}

module.exports = AuthController
