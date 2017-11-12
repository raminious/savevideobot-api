const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const AccessToken = require('../../../db/access-token')

const app = new Koa()

router.post('/user/remove-token', bodyParser(), async function (ctx, next) {
  ctx.assert(ctx.is('json'), 415, 'content type should be json')

  // await AccessToken.remove(ctx.identity.token)
  ctx.body = {}
})

module.exports = app.use(router.routes())
