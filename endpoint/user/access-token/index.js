const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')

const app = new Koa()

const authentications = {
  'basic': require('./methods/basic'),
  'telegram-id': require('./methods/telegram')
}

router.post('/user/access-token', bodyParser(), async function (ctx, next) {

  ctx.assert(ctx.is('json'), 415, 'Content type should be json')

  const method = ctx.request.headers['authentication-method'] || 'basic'
  ctx.assert(Object.keys(authentications).indexOf(method) != -1,
    400, 'invalid authentication method')

  // get user access-token based on authentication method
  const user = await authentications[method].apply(ctx)

  ctx.body = user
})

module.exports = app.use(router.routes())
