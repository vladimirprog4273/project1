/* eslint-disable arrow-body-style */
const { expect } = require('chai')
const request = require('supertest')
const httpStatus = require('http-status')
const Routes = require('../src/api/routes')
const app = require('../src/config/express')({ routes: Routes() })

describe('Status', () => {
  it('should be OK', () => {
    return request(app)
      .get('/status')
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.text).to.equal('OK')
      })
  })
})
