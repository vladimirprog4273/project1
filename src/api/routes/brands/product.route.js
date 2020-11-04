const express = require('express')
const validate = require('../../middlewares/validation')
const {
  product, getProduct, listProducts, editStock,
} = require('../../validations/brands/product.validation')

module.exports = ({ authorize, productController }) => {
  const router = express.Router()

  router.post('/', authorize('brand'), validate(product), productController.addProduct)
  router.get('/', authorize('brand'), validate(listProducts), productController.getProductsList)
  router.get('/:id', authorize('brand'), validate(getProduct), productController.getProduct)
  router.patch('/:id', authorize('brand'), validate(editStock), productController.editProductStock)

  return router
}
