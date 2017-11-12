const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const _ = require('underscore')
const User = require('../../../db/user')

const app = new Koa()

router.post('/telegram/remove-bot', bodyParser(), async function (ctx, next) {
  await User.update(ctx.identity.user_id, {
    telegram_bot: {}
  })

  ctx.body = {}
})

module.exports = app.use(router.routes())
