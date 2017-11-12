const Koa = require('koa')
const router = require('koa-router')()
const app = new Koa()
const User = require('../../../db/user')

router.get('/user/info', async function (ctx, next) {
  const user = await User.findById(ctx.identity.user_id)

  ctx.body = User.getObject(user, {
    access_token: ctx.identity.token
  })
})

module.exports = app.use(router.routes())
