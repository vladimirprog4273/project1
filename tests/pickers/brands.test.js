/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const httpStatus = require('http-status')
const Routes = require('../../src/api/routes/index')
const Express = require('../../src/config/express')

const UserRepository = require('../../src/api/repositories/user')
const PickersController = require('../../src/api/controllers/pickers/pickers.controller')
const PickersRouter = require('../../src/api/routes/pickers')

describe('Pickers', () => {
  function createApp({
    authorize = () => (req, res, next) => { next() },
    userModel = {},
  } = {}) {
    const usersRepository = UserRepository({ User: userModel, config: {} })
    const pickersController = PickersController({ usersRepository })
    const pickersRoute = PickersRouter({ authorize, pickersController })
    const routes = Routes({ pickers: pickersRoute })
    return Express({ routes })
  }

  describe('GET /brands - list of brands for picks', () => {
    it('should use authorize with role "picker"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .get('/pickers/brands')
        .then(() => {
          expect(calledRoles).to.eql(['picker'])
        })
    })

    it('should report error when query limit is greater than 100', () => {
      const app = createApp()

      return request(app)
        .get('/pickers/brands')
        .query({ limit: 200 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ limit: '"limit" must be less than or equal to 100' })
        })
    })

    it('should report error when query limit is less than 1', () => {
      const app = createApp()

      return request(app)
        .get('/pickers/brands')
        .query({ limit: 0 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ limit: '"limit" must be larger than or equal to 1' })
        })
    })

    it('should report error when query page is less than 1', () => {
      const app = createApp()

      return request(app)
        .get('/pickers/brands')
        .query({ limit: 10, page: 0 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ page: '"page" must be larger than or equal to 1' })
        })
    })

    it('should return list of brand by page and limit', () => {
      const brand1 = { name: 'brand1', filed: 'value' }
      const brand2 = { name: 'brand2' }

      const userModel = {
        find: sinon.mock().withExactArgs({ role: 'brand' }).returns({
          limit: sinon.mock().withExactArgs(2).returns({
            skip: sinon.mock().withExactArgs(4).returns({
              exec: sinon.fake.resolves([brand1, brand2]),
            }),
          }),
        }),
        estimatedDocumentCount: sinon.fake.resolves(10),
      }

      const app = createApp({ userModel })

      return request(app)
        .get('/pickers/brands')
        .query({ limit: 2, page: 3 })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.eql({ brands: [{ name: 'brand1' }, brand2], total: 10 })
        })
    })
  })
})
