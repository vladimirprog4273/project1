function transform(user) {
  const transformed = {}
  const fields = ['id', 'name', 'email', 'role', 'createdAt']

  fields.forEach((field) => {
    transformed[field] = user[field]
  })

  return transformed
}

module.exports = transform
