'use strict'

const responseTime = require('koa-response-time')
const ratelimit = require('koa-ratelimit')
const compress = require('koa-compress')
const mount = require('koa-mount')
const koa = require('koa')
const redis = require('redis')
const winston = require('winston')
const request = require('superagent')
const _ = require('underscore')
const routes = require('./routes')
const config = require('./config.json')

module.exports = function api (opt) {

  let app = koa()

  // trust proxy
  app.proxy = true

  // x-response-time
  app.use(responseTime())

  // add request id to every request
  app.use(require('koa-request-id')())

  // handle application errors
  app.use(function *(next) {
    try {
      yield next
    } catch(e) {
      this.log('error', e.message, e.info)
    }
  })

  // logger
  app.use(function* (next) {

    const log = config.log;

    this.log = (level, message, e) => {
      request
      .post(log.url)
      .auth(log.auth.username, log.auth.password, { type: 'auto' })
      .send({
        id: this.id,
        level,
        short_message: message,
        from: 'api'
      })
      .send(e)
      .end((err, res) => {})
    }

    yield* next
  })

  // request rate limit
  app.use(ratelimit({
    db: redis.createClient(),
    duration: 36000,
    max: 100,
    id: context => context.ip,
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total'
    }
  }))

  //routes
  _.each(routes, r => app.use(mount(require(r.path))))

  app.use(function* (){
    this.status = 404
    this.body = 'savevideobot.com - api not found'
  })

  return app
}
