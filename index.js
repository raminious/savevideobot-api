'use strict'

const responseTime = require('koa-response-time')
const ratelimit = require('koa-ratelimit')
const mount = require('koa-mount')
const auth = require('koa-basic-auth')
const health = require('koa-ping')
const koa = require('koa')
const _ = require('underscore')
const routes = require('./routes')
const log = require('./log')
const config = require('./config.json')

// enable system monitors
require('./admin/monitor')

// enable media garbage collector
const gc = require('./util/gc/media')

module.exports = function api (opt) {

  let app = koa()

  // trust proxy
  app.proxy = true

  // x-response-time
  app.use(responseTime())

  // logger
  app.use(function* (next){
    this.log = log
    yield* next
  })

  // handle application errors
  app.use(function *(next) {
    try {
      yield next
    } catch(e) {

      // app requesting http authentication
      if (e.status == 401) {
        this.status = 401
        this.set('WWW-Authenticate', 'Basic');
        this.body = 'authentication required';
        return false
      }

      if (process.env.NODE_ENV != 'production') {
        console.log(e, e.stack)
      }

      // check application fatal errors
      if (e instanceof TypeError || e instanceof ReferenceError) {
        this.log('fatal', 'api_fatal', { description: e.message, stack: e.stack })
      }

      this.status = e.status || 400
      this.body = e.message || 'Internal Server Error'
    }
  })

  // check health of app (authentication enabled)
  app.use(mount('/ping', auth({ name: config.auth.username, pass: config.auth.password })))
  app.use(health())

  //routes
  _.each(routes, r => app.use(mount(require(r.path))))

  app.use(function* (){
    this.status = 404
    this.body = 'savevideobot.com - api not found'
  })

  return app
}
