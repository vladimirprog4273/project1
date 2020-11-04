const expressValidation = require('express-validation')

const options = {
  keyByField: true,
  context: true,
}

function validate(schema) {
  return expressValidation.validate(schema, options)
}

module.exports = validate
