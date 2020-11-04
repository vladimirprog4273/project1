const transform = require('./transform')

function ProductsRepository({ Product }) {
  const create = async (ownerId, data) => {
    const product = await Product.create({ ...data, ownerId })
    return transform(product)
  }

  const findById = async (id) => {
    const product = await Product.findById(id)
    if (product) {
      return transform(product)
    }
    return null
  }

  const getAll = async (ownerId, { page = 1, perPage = 30 }) => {
    const [results, total] = await Promise.all([
      Product.find({ ownerId })
        .sort({ createdAt: -1 })
        .skip(perPage * (page - 1))
        .limit(Number(perPage))
        .exec(),
      Product.countDocuments({ ownerId }),
    ])

    return { products: results.map(transform), total }
  }

  const update = async (id, data) => {
    let product = await Product.findById(id)
    if (!product) {
      return null
    }

    product = Object.assign(product, data)

    const updatedProduct = await product.save()

    return transform(updatedProduct)
  }

  const getList = async (ids) => {
    const products = await Product.find().where('_id').in(ids).exec()

    return products.map(transform)
  }

  return {
    create,
    findById,
    getAll,
    update,
    getList,
  }
}

module.exports = ProductsRepository
