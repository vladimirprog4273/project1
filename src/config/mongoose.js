const mongoose = require('mongoose')

/**
 * Connect to mongo db
 */
exports.connect = (env, uri, callback) => {
  // print mongoose logs in dev env
  if (env === 'development') {
    mongoose.set('debug', true)
  }

  mongoose.connect(uri, {
    useCreateIndex: true,
    keepAlive: 1,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }, (err) => {
    callback(err, mongoose.connection)
  })
}
