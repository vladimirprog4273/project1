/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const mongoose = require('mongoose')
const httpStatus = require('http-status')
const App = require('../../src/config/express')

const ProductsRepository = require('../../src/api/repositories/product')
const ProductController = require('../../src/api/controllers/brands/products.controller')
const ProductRouter = require('../../src/api/routes/brands/product.route')

describe('Brands products', () => {
  function createApp({
    authorize = () => (req, res, next) => { next() },
    productModel = {},
  } = {}) {
    const productsRepository = ProductsRepository({ Product: productModel })
    const productController = ProductController({ productsRepository })
    const routes = ProductRouter({ authorize, productController })
    return App({ routes })
  }

  describe('POST /product', () => {
    it('should use authorize with role "brand"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .post('/')
        .send({})
        .then(() => {
          expect(calledRoles).to.eql(['brand'])
        })
    })

    it('should report error when name is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ name: '"name" is required' })
        })
    })

    it('should report error when price is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ price: '"price" is required' })
        })
    })

    it('should report error when price is less then zero', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', price: -2 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            price: '"price" must be larger than or equal to 0.01',
          })
        })
    })

    it('should report error when description is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', price: 1 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            description: '"description" is required',
          })
        })
    })

    it('should report error when description has a large number of chars', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          price: 1,
          description: (new Array(300).fill('a')).join(''),
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            description: '"description" length must be less than or equal to 200 characters long',
          })
        })
    })

    it('should add new product if all fields ok', () => {
      const ownerId = 'userId1'
      const authorize = () => (req, res, next) => {
        req.user = { id: ownerId }
        next()
      }

      const productData = {
        name: 'name1',
        price: 1,
        description: 'description1',
      }

      const product = { ...productData }

      const productModel = {
        create: sinon.stub().withArgs(ownerId, productData).resolves({
          ...product, ownerId,
        }),
      }

      const app = createApp({ authorize, productModel })

      return request(app)
        .post('/')
        .send(product)
        .expect(httpStatus.CREATED)
        .then(async (res) => {
          expect(res.body).to.eql({ ...product, ownerId: 'userId1' })
        })
    })
  })

  describe('GET /product/:id', () => {
    it('should use authorize with role "brand"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .get(`/${mongoose.Types.ObjectId()}`)
        .then(() => {
          expect(calledRoles).to.eql(['brand'])
        })
    })

    it('should report error if id is not valid', () => {
      const productModel = { findById: sinon.fake.resolves(null) }
      const app = createApp({ productModel })

      return request(app)
        .get('/not_valid_id')
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            id: '"id" with value "not_valid_id" fails to match the valid mongo id pattern',
          })
        })
    })

    it('should report error if no product with id', () => {
      const productModel = { findById: sinon.fake.resolves(null) }
      const app = createApp({ productModel })

      return request(app)
        .get(`/${mongoose.Types.ObjectId()}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.equal(404)
          expect(res.body.message).to.equal('Product does not exist')
        })
    })

    it('should return product with id', async () => {
      const id = mongoose.Types.ObjectId()
      const product = {
        name: 'name1',
        price: 1,
        description: 'description1',
        ownerId: '',
      }

      const productModel = { findById: sinon.stub().withArgs(id).resolves(product) }
      const app = createApp({ productModel })

      return request(app)
        .get(`/${id}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(product)
        })
    })
  })

  describe('GET /product/ - list of products', async () => {
    it('should return products list', async () => {
      const product1 = {
        name: 'name1',
        price: 1,
        description: 'description1',
        ownerId: '',
      }
      const product2 = {
        name: 'name2',
        price: 2,
        description: 'description2',
        ownerId: '',
      }

      const ownerId = 'userId1'

      const productModel = {
        find: sinon.stub().withArgs({ ownerId }).returns({
          sort: sinon.stub().withArgs({ createdAt: -1 }).returns({
            skip: sinon.stub().withArgs(0).returns({
              limit: sinon.stub().withArgs(30).returns({
                exec: sinon.stub().withArgs().resolves([product1, product2]),
              }),
            }),
          }),
        }),
        countDocuments: sinon.stub().withArgs({ ownerId }).returns(2),
      }

      const authorize = () => (req, res, next) => {
        req.user = { id: ownerId }
        next()
      }

      const app = createApp({ authorize, productModel })

      const res = await request(app).get('/').expect(httpStatus.OK)
      expect(res.body).to.eql({
        products: [product1, product2],
        total: 2,
      })
    })

    it('should return products list by params', async () => {
      const product2 = {
        name: 'name2',
        price: 2,
        description: 'description2',
        ownerId: '',
      }

      const query = { page: '2', perPage: '1' }
      const ownerId = 'userId1'

      const productModel = {
        find: sinon.stub().withArgs({ ownerId }).returns({
          sort: sinon.stub().withArgs({ createdAt: -1 }).returns({
            skip: sinon.stub().withArgs(2).returns({
              limit: sinon.stub().withArgs(1).returns({
                exec: sinon.stub().withArgs().resolves([product2]),
              }),
            }),
          }),
        }),
        countDocuments: sinon.stub().withArgs({ ownerId }).returns(2),
      }

      const authorize = () => (req, res, next) => {
        req.user = { id: ownerId }
        next()
      }

      const app = createApp({ authorize, productModel })

      const res = await request(app).get('/').query(query).expect(httpStatus.OK)

      expect(res.body).to.eql({
        products: [product2],
        total: 2,
      })
    })

    it('should use authorize with role "brand"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .get('/')
        .then(() => {
          expect(calledRoles).to.eql(['brand'])
        })
    })

    it('should report error when page is not a number', () => {
      const app = createApp()

      return request(app)
        .get('/')
        .query({ page: 'asd' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            page: '"page" must be a number',
          })
        })
    })

    it('should report error when page is less then 1', () => {
      const app = createApp()

      return request(app)
        .get('/')
        .query({ page: 0 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            page: '"page" must be larger than or equal to 1',
          })
        })
    })

    it('should report error when perPage is not a number', () => {
      const app = createApp()

      return request(app)
        .get('/')
        .query({ perPage: 'qwe' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            perPage: '"perPage" must be a number',
          })
        })
    })

    it('should report error when perPage is less then 1', () => {
      const app = createApp()

      return request(app)
        .get('/')
        .query({ perPage: 0 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            perPage: '"perPage" must be larger than or equal to 1',
          })
        })
    })

    it('should report error when perPage is greater then 100', () => {
      const app = createApp()

      return request(app)
        .get('/')
        .query({ perPage: 200 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            perPage: '"perPage" must be less than or equal to 100',
          })
        })
    })
  })

  describe('PATCH /product', () => {
    it('should use authorize with role "brand"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .patch('/1')
        .then(() => {
          expect(calledRoles).to.eql(['brand'])
        })
    })

    it('should report error when type is not valid', () => {
      const app = createApp()

      return request(app)
        .patch(`/${mongoose.Types.ObjectId()}`)
        .send({ type: 'not_valid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            type: '"type" must be one of [clothes, shoes, jewelry]',
          })
        })
    })

    it('should report error when sizes is not provided and type provided', () => {
      const app = createApp()

      return request(app)
        .patch(`/${mongoose.Types.ObjectId()}`)
        .send({ type: 'clothes' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ sizes: '"sizes" is required' })
        })
    })

    it('should report error when outOfStock is not valid', () => {
      const app = createApp()

      return request(app)
        .patch(`/${mongoose.Types.ObjectId()}`)
        .send({ outOfStock: 'not_valid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            outOfStock: '"outOfStock" must be a boolean',
          })
        })
    })

    it('should report error if no product with id', () => {
      const productModel = { findById: sinon.fake.resolves(null) }

      const app = createApp({ productModel })

      return request(app)
        .patch(`/${mongoose.Types.ObjectId()}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.equal(404)
          expect(res.body.message).to.equal('Product does not exist')
        })
    })

    it('should change outOfStock when provided', async () => {
      const id = mongoose.Types.ObjectId()
      const productData = {
        name: 'name1',
        price: 1,
        description: 'description1',
        ownerId: '',
      }

      const productDoc = { ...productData }
      productDoc.save = sinon.fake.resolves(productDoc)

      const productModel = {
        findById: sinon.stub().withArgs(id).resolves(productDoc),
      }

      const app = createApp({ productModel })

      return request(app)
        .patch(`/${id}`)
        .send({ outOfStock: true })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.eql({ ...productData, outOfStock: true })
        })
    })

    it('should change type and sizes when provided', async () => {
      const id = mongoose.Types.ObjectId()
      const productData = {
        name: 'name1',
        price: 1,
        description: 'description1',
        ownerId: '',
      }

      const productDoc = { ...productData }
      productDoc.save = sinon.fake.resolves(productDoc)

      const productModel = {
        findById: sinon.stub().withArgs(id).resolves(productDoc),
      }

      const type = 'clothes'
      const sizes = 'XS/S/M/L/XL/XXL'
      const app = createApp({ productModel })

      return request(app)
        .patch(`/${id}`)
        .send({ type, sizes })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.eql({ ...productData, type, sizes })
        })
    })
  })
})
