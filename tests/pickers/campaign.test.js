/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const mongoose = require('mongoose')
const httpStatus = require('http-status')
const moment = require('moment-timezone')
const Routes = require('../../src/api/routes/index')
const Express = require('../../src/config/express')

const UserRepository = require('../../src/api/repositories/user')
const ProductsRepository = require('../../src/api/repositories/product')
const CampaignRepository = require('../../src/api/repositories/campaign')
const PickersController = require('../../src/api/controllers/pickers/pickers.controller')
const PickersRouter = require('../../src/api/routes/pickers')

describe('Pickers', () => {
  function createApp({
    authorize = () => (req, res, next) => { next() },
    userModel = {}, productModel = {}, campaignModel = {},
  } = {}) {
    const usersRepository = UserRepository({ User: userModel, config: {} })
    const productsRepository = ProductsRepository({ Product: productModel })
    const campaignRepository = CampaignRepository({ Campaign: campaignModel })
    const pickersController = PickersController({
      usersRepository, productsRepository, campaignRepository,
    })
    const pickersRoute = PickersRouter({ authorize, pickersController })
    const routes = Routes({ pickers: pickersRoute })
    return Express({ routes })
  }

  describe('POST /campaign - create a campaign', () => {
    it('should use authorize with role "picker"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .post('/pickers/campaign')
        .send({})
        .then(() => {
          expect(calledRoles).to.eql(['picker'])
        })
    })

    it('should report error when products is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/pickers/campaign')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ products: '"products" is required' })
        })
    })

    it('should report error when products is not array', () => {
      const app = createApp()

      return request(app)
        .post('/pickers/campaign')
        .send({ products: '123' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ products: '"products" must be an array' })
        })
    })

    it('should report error when products items is not valid id', () => {
      const app = createApp()

      return request(app)
        .post('/pickers/campaign')
        .send({ products: ['123'] })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            0: '"products[0]" with value "123" fails to match the valid mongo id pattern',
          })
        })
    })

    it('should report error when brandId is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/pickers/campaign')
        .send({ products: [mongoose.Types.ObjectId()] })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            brandId: '"brandId" is required',
          })
        })
    })

    it('should report error when brandId is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/pickers/campaign')
        .send({ products: [mongoose.Types.ObjectId()], brandId: 'not_valid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            brandId: '"brandId" with value "not_valid" fails to match the valid mongo id pattern',
          })
        })
    })

    it('should report error when no user with brandId', () => {
      const userModel = {
        findById: sinon.fake.resolves(null),
      }

      const app = createApp({ userModel })

      return request(app)
        .post('/pickers/campaign')
        .send({ products: [mongoose.Types.ObjectId()], brandId: mongoose.Types.ObjectId() })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.message
          expect(error).to.equal('User does not exist')
        })
    })

    it('should report error when user role with brandId is not "brand"', () => {
      const userModel = {
        findById: sinon.fake.resolves({ role: 'picker' }),
      }

      const app = createApp({ userModel })

      return request(app)
        .post('/pickers/campaign')
        .send({ products: [mongoose.Types.ObjectId()], brandId: mongoose.Types.ObjectId() })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.message
          expect(error).to.equal('User is not brand')
        })
    })

    it('should report error when products is not from brand', () => {
      const userModel = {
        findById: sinon.fake.resolves({ role: 'brand' }),
      }

      const product1 = {
        ownerId: '123',
      }

      const productModel = {
        find: sinon.stub().withArgs().returns({
          where: sinon.stub().withArgs('_id').returns({
            in: sinon.stub().withArgs([]).returns({
              exec: sinon.stub().withArgs().resolves([product1]),
            }),
          }),
        }),
      }

      const app = createApp({ userModel, productModel })

      return request(app)
        .post('/pickers/campaign')
        .send({ products: [mongoose.Types.ObjectId()], brandId: mongoose.Types.ObjectId() })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.message
          expect(error).to.equal('Invalid products list')
        })
    })

    it('should create campaign if all ok', () => {
      const ownerId = 'userId1'
      const authorize = () => (req, res, next) => {
        req.user = { id: ownerId }
        next()
      }

      const userModel = {
        findById: sinon.fake.resolves({ role: 'brand' }),
      }

      const brandId = mongoose.Types.ObjectId().toString()

      const product1 = {
        ownerId: brandId,
      }

      const productModel = {
        find: sinon.stub().withArgs().returns({
          where: sinon.stub().withArgs('_id').returns({
            in: sinon.stub().withArgs([]).returns({
              exec: sinon.stub().withArgs().resolves([product1]),
            }),
          }),
        }),
      }

      const campaignModel = {
        create: sinon.fake.resolves({}),
      }

      const app = createApp({
        authorize, userModel, productModel, campaignModel,
      })

      return request(app)
        .post('/pickers/campaign')
        .send({ products: [mongoose.Types.ObjectId()], brandId })
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.include({
            ownerId,
            brandId,
          })
          expect(res.body.products).to.eql([product1])
          const checkTime = moment().add(7, 'day').toDate().getTime()
          expect(moment(res.body.expires).toDate().getTime()).to.be.within(
            checkTime - 1000, checkTime + 1000,
          )
        })
    })
  })
})
