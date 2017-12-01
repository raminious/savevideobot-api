const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const _ = require('underscore')
const User = require('../../../db/user')

const app = new Koa()

router.post('/telegram/add-bot', bodyParser(), async function (ctx, next) {
  ctx.assert(ctx.is('json'), 415, 'Content type should be json')
  const { token, botInfo } = ctx.request.body

  await User.update(ctx.identity.user_id, {
    telegram_bot: {
      token,
      name: botInfo.first_name,
      username: botInfo.username.toLowerCase()
    }
  })

  ctx.body = {}
})

module.exports = app.use(router.routes())
