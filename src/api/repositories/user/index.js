const bcrypt = require('bcryptjs')
const moment = require('moment-timezone')
const { v4: uuidv4 } = require('uuid')
const httpStatus = require('http-status')
const jwt = require('jwt-simple')
const APIError = require('../../utils/APIError')
const transform = require('./transform')

function UserRepository({ User, config }) {
  const { rounds = 10 } = config

  const create = async (data) => {
    const user = await User.create(data)
    return transform(user)
  }

  const findById = async (id) => {
    const user = await User.findById(id)
    if (user) {
      return transform(user)
    }
    return null
  }

  const createProfile = async (id, profile) => {
    const user = await User.findById(id)
    if (!user) {
      return null
    }

    user.profile = profile
    await user.save()

    return profile
  }

  const hashPassword = async password => bcrypt.hash(password, rounds)

  const findAndGenerateToken = async (options) => {
    const { email, password, refreshObject } = options
    if (!email) throw new APIError({ message: 'An email is required to generate a token' })

    const user = await User.findOne({ email }).exec()
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    }
    if (password) {
      if (user && await passwordMatches(password, user.passwordHash)) {
        return { user: transform(user), accessToken: token(user.id) }
      }
      err.message = 'Incorrect email or password'
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.'
      } else {
        return { user: transform(user), accessToken: token(user.id) }
      }
    } else {
      err.message = 'Incorrect email or refreshToken'
    }
    throw new APIError(err)
  }

  async function passwordMatches(password, passwordHash) {
    return bcrypt.compare(password, passwordHash)
  }

  const checkDuplicateEmail = (error) => {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'email',
          location: 'body',
          messages: ['"email" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      })
    }
    return error
  }

  const oAuthLogin = async ({
    service, id, email, name,
  }) => {
    const user = await User.findOne({
      $or: [{ [`services.${service}`]: id }, { email }],
    })
    if (user) {
      user.services[service] = id
      if (!user.name) user.name = name
      return user.save()
    }
    const password = uuidv4()
    const passwordHash = await hashPassword(password)
    return User.create({
      services: { [service]: id }, email, passwordHash, name,
    })
  }

  function token(id) {
    const payload = {
      exp: moment().add(config.jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: id,
    }
    return jwt.encode(payload, config.jwtSecret)
  }

  const getBrandsList = async (page, limit) => {
    const [results, total] = await Promise.all([
      User.find({ role: 'brand' }).limit(limit).skip((page - 1) * limit).exec(),
      User.estimatedDocumentCount({}),
    ])

    return { brands: results.map(transform), total }
  }

  return {
    create,
    findById,
    createProfile,
    hashPassword,
    findAndGenerateToken,
    checkDuplicateEmail,
    oAuthLogin,
    token,
    getBrandsList,
  }
}

module.exports = UserRepository
