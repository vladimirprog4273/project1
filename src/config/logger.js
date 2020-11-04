const pino = require('pino')

const DEFAULT_LOG_LEVEL = 'info'
const VALID_LOG_LEVELS = ['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']

/* istanbul ignore next */
const level = VALID_LOG_LEVELS.includes(process.env.LOG_LEVEL)
  ? process.env.LOG_LEVEL
  : DEFAULT_LOG_LEVEL

module.exports = function createLogger(name, base = {}) {
  return pino({
    name,
    level,
    base,
  })
}
