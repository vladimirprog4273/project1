function transform(refreshToken) {
  const transformed = {}
  const fields = ['token', 'expires']

  fields.forEach((field) => {
    transformed[field] = refreshToken[field]
  })

  return transformed
}

module.exports = transform
