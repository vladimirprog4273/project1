/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const mongoose = require('mongoose')
const httpStatus = require('http-status')
const App = require('../../src/config/express')

const ProfileController = require('../../src/api/controllers/brands/profile.controller')
const ProfileRouter = require('../../src/api/routes/brands/profile.route')

describe('Brands profiles', () => {
  function createApp({
    authorize = () => (req, res, next) => { next() },
    usersRepository = {},
  } = {}) {
    const profileController = ProfileController({ usersRepository })
    const routes = ProfileRouter({ authorize, profileController })
    return App({ routes })
  }

  describe('POST /profile', () => {
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

    it('should report error when country is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ country: '"country" is required' })
        })
    })

    it('should report error when country is empty', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', country: '' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ country: '"country" is not allowed to be empty' })
        })
    })

    it('should report error when website is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', country: 'c' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ website: '"website" is required' })
        })
    })

    it('should report error when website is empty', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', country: 'c', website: '' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ website: '"website" is not allowed to be empty' })
        })
    })

    it('should report error when website is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', country: 'c', website: 'w' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ website: '"website" must be a valid uri' })
        })
    })

    it('should report error when instagram is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({ name: 'name1', country: 'c', website: 'http://site.com' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ instagram: '"instagram" is required' })
        })
    })

    it('should report error when instagram is empty', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          country: 'c',
          website: 'http://site.com',
          instagram: '',
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ instagram: '"instagram" is not allowed to be empty' })
        })
    })

    it('should report error when instagram is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          country: 'c',
          website: 'http://site.com',
          instagram: 'i',
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ instagram: '"instagram" must be a valid uri' })
        })
    })

    it('should report error when code is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          country: 'c',
          website: 'http://site.com',
          instagram: 'http://site.com',
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ code: '"code" is required' })
        })
    })

    it('should report error when code is not a number', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          country: 'c',
          website: 'http://site.com',
          instagram: 'http://site.com',
          code: 'asd',
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ code: '"code" must be a number' })
        })
    })

    it('should report error when phone is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          country: 'c',
          website: 'http://site.com',
          instagram: 'http://site.com',
          code: 123,
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ phone: '"phone" is required' })
        })
    })

    it('should report error when phone is empty', () => {
      const app = createApp()

      return request(app)
        .post('/')
        .send({
          name: 'name1',
          country: 'c',
          website: 'http://site.com',
          instagram: 'http://site.com',
          code: 123,
          phone: '',
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ phone: '"phone" is not allowed to be empty' })
        })
    })

    it('should add new product if all fields ok', () => {
      const id = mongoose.Types.ObjectId().toString()
      const authorize = () => (req, res, next) => {
        req.user = { id }
        next()
      }

      const profile = {
        name: 'name1',
        country: 'c',
        website: 'http://site.com',
        instagram: 'http://site.com',
        code: 123,
        phone: '1234567',
      }

      const createProfile = sinon.stub()
      createProfile.withArgs(id, profile).resolves(profile)
      const usersRepository = { createProfile }
      const app = createApp({ authorize, usersRepository })

      return request(app)
        .post('/')
        .send(profile)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.eql(profile)
        })
    })
  })
})
