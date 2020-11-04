const crypto = require('crypto')
const moment = require('moment-timezone')
const transform = require('./transform')

function RefreshTokenRepository({ RefreshToken }) {
  const generate = async (userId, userEmail) => {
    const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`

    const expires = moment().add(30, 'days').toDate()

    const tokenDoc = await RefreshToken.create({
      token, userId, userEmail, expires,
    })

    return transform(tokenDoc)
  }

  return { generate }
}

module.exports = RefreshTokenRepository
