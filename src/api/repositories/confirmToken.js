const crypto = require('crypto')
const moment = require('moment-timezone')
const { pick } = require('lodash')

function ConfirmTokenRepository({ ConfirmToken }) {
  const generate = async (userId, userEmail) => {
    const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`

    const expires = moment().add(30, 'days').toDate()

    const tokenDoc = await ConfirmToken.create({
      token, userId, userEmail, expires,
    })

    return transform(tokenDoc)
  }

  const findAndRemove = async (userEmail, token) => {
    const tokenDoc = await ConfirmToken.findOneAndRemove({ userEmail, token })

    if (tokenDoc) {
      return transform(tokenDoc)
    }

    return null
  }

  return { generate, findAndRemove }
}

function transform(refreshToken) {
  return pick(refreshToken, ['token', 'expires'])
}

module.exports = ConfirmTokenRepository
