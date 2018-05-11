const Koa = require('koa')
const responseTime = require('koa-response-time')
const mount = require('koa-mount')
const i18next = require('i18next')
const i18nextBackend = require('i18next-sync-fs-backend')
const cors = require('koa2-cors')
const path = require('path')
const _ = require('underscore')
const routes = require('./routes')
const log = require('./log')
const report = require('./admin/report/telegram')
const config = require('./config.json')
const corsConfig = require('./cors.json')

// enable system monitors
require('./admin/monitor')

// enable media garbage collector
const gc = require('./util/gc/media')

i18next.use(i18nextBackend).init({
  backend: {
    loadPath: path.resolve('./locales/{{lng}}/list.json')
  },
  debug: false,
  initImmediate: false,
  joinArrays: true,
  lng: 'en',
  preload: ['en', 'fa'],
  fallbackLng: 'en'
})

module.exports = function api() {
  const app = new Koa()

  // trust proxy
  app.proxy = true

  app.use(
    cors({
      origin: ctx => {
        if (process.env.NODE_ENV === 'production') {
          return corsConfig.domains.indexOf(ctx.headers.origin) > -1
            ? '*'
            : false
        } else {
          return '*'
        }
      },
      maxAge: 5,
      credentials: true,
      allowMethods: ['GET', 'POST']
    })
  )

  // logger
  app.use(async function(ctx, next) {
    ctx.log = log
    return await next()
  })

  app.use(async function(ctx, next) {
    ctx.locale = ctx.headers['app-language'] || 'en'

    ctx.t = function(key, args) {
      return i18next.t(key, {
        ...args,
        lng: ctx.locale
      })
    }

    return await next()
  })

  // handle application errors
  app.use(async function(ctx, next) {
    try {
      return await next()
    } catch (e) {
      // app requesting http authentication
      if (e.status == 401) {
        ctx.status = 401
        ctx.set('WWW-Authenticate', 'Basic')
        ctx.body = ctx.t('authentication required')
        return false
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(e, e.stack)
      }

      // check application fatal errors
      if (e instanceof TypeError || e instanceof ReferenceError) {
        ctx.log('fatal', 'api_fatal', {
          description: e.message,
          stack: e.stack
        })

        report.sendMessage(`[API Fatal] ${e.message} - ${e.stack}`)
      }

      ctx.status = e.status || 400
      ctx.body = e.message || 'Internal Server Error'
    }
  })

  //routes
  _.each(routes, r => app.use(mount(require(r.path))))

  app.use(async function(ctx) {
    ctx.status = 404
    ctx.body = 'savevideobot.com - api not found'
  })

  return app
}
