const httpStatus = require('http-status')
const APIError = require('../../utils/APIError')

module.exports = ({ productsRepository }) => {
  const addProduct = async (req, res, next) => {
    try {
      const product = await productsRepository.create(req.user.id, req.body)
      res.status(httpStatus.CREATED).json(product)
    } catch (error) {
      next(error)
    }
  }

  const getProduct = async (req, res, next) => {
    try {
      const product = await productsRepository.findById(req.params.id)

      if (product) {
        res.json(product)
      } else {
        next(new APIError({
          message: 'Product does not exist',
          status: httpStatus.NOT_FOUND,
        }))
      }
    } catch (error) {
      next(error)
    }
  }

  const getProductsList = async (req, res, next) => {
    try {
      const products = await productsRepository.getAll(req.user.id, req.query)
      res.json(products)
    } catch (error) {
      next(error)
    }
  }

  const editProductStock = async (req, res, next) => {
    try {
      const updatedProduct = await productsRepository.update(req.params.id, req.body)
      if (updatedProduct) {
        res.json(updatedProduct)
      } else {
        next(new APIError({
          message: 'Product does not exist',
          status: httpStatus.NOT_FOUND,
        }))
      }
    } catch (error) {
      next(error)
    }
  }

  return {
    addProduct,
    getProduct,
    getProductsList,
    editProductStock,
  }
}
