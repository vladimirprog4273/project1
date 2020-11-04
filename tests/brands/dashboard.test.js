/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const httpStatus = require('http-status')
const Routes = require('../../src/api/routes/index')
const Express = require('../../src/config/express')

const CampaignRepository = require('../../src/api/repositories/campaign')
const DashboardController = require('../../src/api/controllers/brands/dashboard.controller')
const DashboardRouter = require('../../src/api/routes/brands/dashboard.route')
const BrandsRouter = require('../../src/api/routes/brands')

describe('Brands', () => {
  function createApp({
    authorize = () => (req, res, next) => { next() },
    campaignModel = {},
  } = {}) {
    const campaignRepository = CampaignRepository({ Campaign: campaignModel })
    const dashboardController = DashboardController({ campaignRepository })
    const dashboardRouter = DashboardRouter({ authorize, dashboardController })
    const brandsRoute = BrandsRouter({
      dashboardRouter, productRouter: () => {}, profileRouter: () => {},
    })
    const routes = Routes({ brands: brandsRoute })
    return Express({ routes })
  }

  describe('GET /campaigns - list of pickers campaigns', () => {
    it('should use authorize with role "picker"', () => {
      const calledRoles = []
      const authorize = roles => (req, res, next) => {
        calledRoles.push(roles)
        next()
      }

      const app = createApp({ authorize })

      return request(app)
        .get('/brands/dashboard/campaigns')
        .then(() => {
          expect(calledRoles).to.eql(['brand'])
        })
    })

    it('should report error when query limit is greater than 100', () => {
      const app = createApp()

      return request(app)
        .get('/brands/dashboard/campaigns')
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
        .get('/brands/dashboard/campaigns')
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
        .get('/brands/dashboard/campaigns')
        .query({ limit: 10, page: 0 })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ page: '"page" must be larger than or equal to 1' })
        })
    })

    it('should return list of brand by page and limit', () => {
      const ownerId = 'userId1'
      const authorize = () => (req, res, next) => {
        req.user = { id: ownerId }
        next()
      }

      const campaign1 = { }
      const campaign2 = { }

      const campaignModel = {
        find: sinon.mock().withExactArgs({ brandId: ownerId }).returns({
          limit: sinon.mock().withExactArgs(3).returns({
            skip: sinon.mock().withExactArgs(3).returns({
              populate: sinon.mock().withExactArgs('ownerId').returns({
                exec: sinon.fake.resolves([campaign1, campaign2]),
              }),
            }),
          }),
        }),
        countDocuments: sinon.fake.resolves(7),
      }

      const app = createApp({ authorize, campaignModel })

      return request(app)
        .get('/brands/dashboard/campaigns')
        .query({ limit: 3, page: 2 })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.eql({ campaigns: [campaign1, campaign2], total: 7 })
        })
    })
  })
})
