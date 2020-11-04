/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const httpStatus = require('http-status')
const moment = require('moment-timezone')
const Routes = require('../src/api/routes/index')
const App = require('../src/config/express')

const UsersRepository = require('../src/api/repositories/user')
const RefreshTokenRepository = require('../src/api/repositories/refreshToken')
const ConfirmTokenRepository = require('../src/api/repositories/confirmToken')
const AuthController = require('../src/api/controllers/auth.controller')
const AuthRoutes = require('../src/api/routes/auth.route')

describe('Authentication API', () => {
  const config = { rounds: 1, jwtSecret: 'secret-key', jwtExpirationInterval: 15 }

  function createApp({
    userModel = {},
    refreshTokenModel = {},
    confirmTokenModel = {},
  } = {}) {
    const usersRepository = UsersRepository({ User: userModel, config })

    const refreshTokenRepository = RefreshTokenRepository({ RefreshToken: refreshTokenModel })
    const confirmTokenRepository = ConfirmTokenRepository({ ConfirmToken: confirmTokenModel })
    const authController = AuthController({
      refreshTokenRepository, usersRepository, confirmTokenRepository,
    })
    const authRoute = AuthRoutes({ authController })
    const routes = Routes({ auth: authRoute })
    return App({ routes })
  }

  describe('POST /auth/register', () => {
    it('should register a new brand user when request is ok', () => {
      const brandUser = {
        name: 'Other Name',
        email: 'other_mail@gmail.com',
        password: '123456',
        role: 'brand',
      }

      const userModel = { create: sinon.fake.resolves(brandUser) }
      const refreshTokenModel = { create: sinon.fake.resolves({ token: 'token1' }) }
      const app = createApp({ userModel, refreshTokenModel })

      return request(app)
        .post('/auth/register')
        .send(brandUser)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken')
          expect(res.body.token).to.have.a.property('refreshToken')
          expect(res.body.token).to.have.a.property('expiresIn')
          const { password, ...brandUserWithoutPassword } = brandUser
          expect(res.body.user).to.eql(brandUserWithoutPassword)
        })
    })

    it('should register a new picker user when request is ok', () => {
      const pickerUser = {
        name: 'Picker Name',
        email: 'picker_mail@gmail.com',
        password: '12345678',
        role: 'picker',
      }

      const userModel = { create: sinon.fake.resolves(pickerUser) }
      const refreshTokenModel = { create: sinon.fake.resolves({ token: 'token1' }) }
      const app = createApp({ userModel, refreshTokenModel })

      return request(app)
        .post('/auth/register')
        .send(pickerUser)
        .expect(httpStatus.CREATED)
        .then((res) => {
          delete pickerUser.password
          expect(res.body.token).to.have.a.property('accessToken')
          expect(res.body.token).to.have.a.property('refreshToken')
          expect(res.body.token).to.have.a.property('expiresIn')
          expect(res.body.user).to.include(pickerUser)
        })
    })

    it('should report error when email already exists', () => {
      const error = new Error()
      error.name = 'MongoError'
      error.code = 11000

      const userModel = { create: sinon.fake.throws(error) }
      const app = createApp({ userModel })

      const user = {
        email: 'email@gmail.com',
        password: '123456',
        name: 'Full Name',
        role: 'admin',
      }

      return request(app)
        .post('/auth/register')
        .send(user)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          const { field } = res.body.errors[0]
          const { location } = res.body.errors[0]
          const { messages } = res.body.errors[0]
          expect(field).to.equal('email')
          expect(location).to.equal('body')
          expect(messages).to.contain('"email" already exists')
        })
    })

    it('should report error when the email provided is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({ email: 'not_valid_email' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ email: '"email" must be a valid email' })
        })
    })

    it('should report error when email is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ email: '"email" is required' })
        })
    })

    it('should report error when password is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({ email: 'valid@email.com' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ password: '"password" is required' })
        })
    })

    it('should report error when password is too short', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({ email: 'valid@email.com', password: '123' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            password: '"password" length must be at least 6 characters long',
          })
        })
    })

    it('should report error when role is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({ email: 'valid@email.com', password: '123456' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ role: '"role" is required' })
        })
    })

    it('should report error when role is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({ email: 'valid@email.com', password: '123456', role: 'not_valid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({
            role: '"role" must be one of [brand, picker, shopper, admin]',
          })
        })
    })

    it('should report error when name is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/register')
        .send({ email: 'valid@email.com', password: '123456', role: 'brand' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ name: '"name" is required' })
        })
    })
  })

  describe('POST /auth/login', () => {
    it('should return an accessToken and a refreshToken when email and password matches', async () => {
      const userRepository = UsersRepository({ User: {}, config })
      const user = { email: 'email@mail.com', password: 'myPassword' }
      const passwordHash = await userRepository.hashPassword(user.password)
      const userModel = {
        findOne: () => ({
          exec: sinon.fake.resolves({
            ...user,
            passwordHash,
            token: userRepository.token,
          }),
        }),
      }

      const refreshTokenModel = { create: sinon.fake.resolves({ token: 'token1' }) }
      const app = createApp({ userModel, refreshTokenModel })

      return request(app)
        .post('/auth/login')
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken')
          expect(res.body.token).to.have.a.property('refreshToken')
          expect(res.body.token).to.have.a.property('expiresIn')
          const { password, ...userWithoutPassword } = user
          expect(res.body.user).to.eql(userWithoutPassword)
        })
    })

    it('should report error when email is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/login')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ email: '"email" is required' })
        })
    })

    it('should report error when password is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/login')
        .send({ email: 'email@gmail.com' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ password: '"password" is required' })
        })
    })

    it('should report error when email is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/auth/login')
        .send({ email: 'not_valid_email' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ email: '"email" must be a valid email' })
        })
    })
  })

  describe('POST /auth/confirm', () => {
    it('should return an ', async () => {
      const userEmail = 'email@gmail.com'
      const sendToken = 'a'.repeat(128)

      const confirmTokenModel = {
        findOneAndRemove: sinon.fake.resolves({
          expires: moment().add(1, 'day').toDate(),
        }),
      }

      const app = createApp({ confirmTokenModel })

      return request(app)
        .post('/auth/confirm')
        .send({ email: userEmail, token: sendToken })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.equal('Email confirmed')
        })
    })

    it('should report error when email is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/confirm')
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ email: '"email" is required' })
        })
    })

    it('should report error when email is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/auth/confirm')
        .send({ email: 'not_valid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.include({ email: '"email" must be a valid email' })
        })
    })

    it('should report error when token is not provided', () => {
      const app = createApp()

      return request(app)
        .post('/auth/confirm')
        .send({ email: 'email@gmail.com' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ token: '"token" is required' })
        })
    })

    it('should report error when token is not valid', () => {
      const app = createApp()

      return request(app)
        .post('/auth/confirm')
        .send({ email: 'email@gmail.com', token: 'not_valid' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.errors[0]
          expect(error).to.eql({ token: '"token" length must be 128 characters long' })
        })
    })

    it('should report error when no token to confirm', () => {
      const userEmail = 'email@gmail.com'
      const sendToken = 'a'.repeat(128)

      const confirmTokenModel = {
        findOneAndRemove: sinon.fake.resolves(null),
      }

      const app = createApp({ confirmTokenModel })

      return request(app)
        .post('/auth/confirm')
        .send({ email: userEmail, token: sendToken })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.message
          expect(error).to.equal('Email is no need to confirm')
        })
    })

    it('should report error when token is expired', () => {
      const userEmail = 'email@gmail.com'
      const sendToken = 'a'.repeat(128)

      const confirmTokenModel = {
        findOneAndRemove: sinon.fake.resolves({
          expires: moment().subtract(1, 'day').toDate(),
        }),
      }

      const app = createApp({ confirmTokenModel })

      return request(app)
        .post('/auth/confirm')
        .send({ email: userEmail, token: sendToken })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const error = res.body.message
          expect(error).to.equal('Confirm token is expired')
        })
    })
  })
})
