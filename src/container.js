const { createContainer, asValue, asFunction } = require('awilix')
const { model, Schema } = require('mongoose')

const config = require('./config/vars')

const Express = require('./config/express')
const Strategies = require('./config/passport')
const Routes = require('./api/routes')

const AuthRoutes = require('./api/routes/auth.route')
const BrandsRouter = require('./api/routes/brands')
const PickersRouter = require('./api/routes/pickers')
const ProductRouter = require('./api/routes/brands/product.route')
const ProfileRouter = require('./api/routes/brands/profile.route')
const DashboardRouter = require('./api/routes/brands/dashboard.route')

const AuthController = require('./api/controllers/auth.controller')
const ProductController = require('./api/controllers/brands/products.controller')
const ProfileController = require('./api/controllers/brands/profile.controller')
const PickersController = require('./api/controllers/pickers/pickers.controller')
const DashboardController = require('./api/controllers/brands/dashboard.controller')

const RefreshTokenRepository = require('./api/repositories/refreshToken')
const UsersRepository = require('./api/repositories/user')
const ConfirmTokenRepository = require('./api/repositories/confirmToken')
const ProductsRepository = require('./api/repositories/product')
const CampaignRepository = require('./api/repositories/campaign')

const confirmTokenSchema = require('./api/models/confirmToken')
const { userSchema } = require('./api/models/user')
const { productSchema } = require('./api/models/product')
const campaignSchema = require('./api/models/campaign')
const refreshTokenSchema = require('./api/models/refreshToken')

const Auth = require('./api/middlewares/auth')

const container = createContainer()

// System
container.register({
  config: asValue(config),

  // middlewares
  authorize: asFunction(Auth).singleton(),

  // app
  app: asFunction(Express).singleton(),
  strategies: asFunction(Strategies).singleton(),
  routes: asFunction(Routes).singleton(),

  // routes
  auth: asFunction(AuthRoutes).singleton(),
  brands: asFunction(BrandsRouter).singleton(),
  pickers: asFunction(PickersRouter).singleton(),
  productRouter: asFunction(ProductRouter).singleton(),
  profileRouter: asFunction(ProfileRouter).singleton(),
  dashboardRouter: asFunction(DashboardRouter).singleton(),

  // controllers
  authController: asFunction(AuthController).singleton(),
  productController: asFunction(ProductController).singleton(),
  profileController: asFunction(ProfileController).singleton(),
  pickersController: asFunction(PickersController).singleton(),
  dashboardController: asFunction(DashboardController).singleton(),

  // repositories
  productsRepository: asFunction(ProductsRepository).singleton(),
  refreshTokenRepository: asFunction(RefreshTokenRepository).singleton(),
  usersRepository: asFunction(UsersRepository).singleton(),
  confirmTokenRepository: asFunction(ConfirmTokenRepository).singleton(),
  campaignRepository: asFunction(CampaignRepository).singleton(),

  // models
  RefreshToken: asValue(model('RefreshToken', new Schema(refreshTokenSchema))),
  ConfirmToken: asValue(model('ConfirmToken', new Schema(confirmTokenSchema))),
  User: asValue(model('User', new Schema(userSchema))),
  Product: asValue(model('Product', new Schema(productSchema))),
  Campaign: asValue(model('Campaign', new Schema(campaignSchema))),
})

module.exports = container
