const axios = require('axios')

exports.facebook = async (accessToken) => {
  const fields = 'id, name, email'
  const url = 'https://graph.facebook.com/me'
  const params = { access_token: accessToken, fields }
  const response = await axios.get(url, { params })
  const {
    id, name, email,
  } = response.data
  return {
    service: 'facebook',
    id,
    name,
    email,
  }
}

exports.google = async (accessToken) => {
  const url = 'https://www.googleapis.com/oauth2/v3/userinfo'
  const params = { access_token: accessToken }
  const response = await axios.get(url, { params })
  const {
    sub, name, email,
  } = response.data
  return {
    service: 'google',
    id: sub,
    name,
    email,
  }
}
