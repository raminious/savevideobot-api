const Koa = require('koa')
const responseTime = require('koa-response-time')
const ratelimit = require('koa-ratelimit')
const mount = require('koa-mount')
const auth = require('koa-basic-auth')
const health = require('koa-ping')
const _ = require('underscore')
const routes = require('./routes')
const log = require('./log')
const config = require('./config.json')

// enable system monitors
require('./admin/monitor')

// enable media garbage collector
const gc = require('./util/gc/media')

module.exports = function api(opt) {

  const app = new Koa()

  // trust proxy
  app.proxy = true

  // x-response-time
  app.use(responseTime())

  // logger
  app.use(async function (ctx, next){
    ctx.log = log
    return await next()
  })

  // handle application errors
  app.use(async function(ctx, next) {
    try {
      return await next()
    } catch(e) {

      // app requesting http authentication
      if (e.status == 401) {
        ctx.status = 401
        ctx.set('WWW-Authenticate', 'Basic');
        ctx.body = 'authentication required';
        return false
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(e, e.stack)
      }

      // check application fatal errors
      if (e instanceof TypeError || e instanceof ReferenceError) {
        ctx.log('fatal', 'api_fatal', { description: e.message, stack: e.stack })
      }

      ctx.status = e.status || 400
      ctx.body = e.message || 'Internal Server Error'
    }
  })

  //routes
  _.each(routes, r => app.use(
    mount(require(r.path)))
  )

  app.use(async function(ctx){
    ctx.status = 404
    ctx.body = 'savevideobot.com - api not found'
  })

  return app
}
