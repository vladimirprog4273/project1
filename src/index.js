const morgan = require('morgan')
const {
  port, env, mongo, logs,
} = require('./config/vars')
const log = require('./config/logger')('app:index')
const mongoose = require('./config/mongoose')
const container = require('./container')

// open mongoose connection
mongoose.connect(env, mongo.uri, (err, connection) => {
  if (err) {
    log.error({ err }, 'MongoDB connection error')
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }

  process.on('uncaughtException', (e) => {
    log.error({ err: e }, 'uncaughtException')
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })

  process.on('unhandledRejection', (e) => {
    log.error({ err: e }, 'unhandledRejection')
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })

  const app = container.resolve('app')

  // request logging. dev: console | production: file
  app.use(morgan(logs))

  // listen to requests
  const server = app.listen(port, () => {
    log.info(`server started on port ${port} (${env})`)
  })

  function shutdown() {
    server.close(async () => {
      await connection.close(true)
      // eslint-disable-next-line no-process-exit
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
})
