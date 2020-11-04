function transform(product) {
  const transformed = {}
  const fields = [
    'id', 'name', 'price', 'description', 'outOfStock', 'type', 'sizes',
  ]

  fields.forEach((field) => {
    transformed[field] = product[field]
  })

  transformed.ownerId = product.ownerId.toString()

  return transformed
}

module.exports = transform
