const Koa = require('koa')
const router = require('koa-router')()
const app = new Koa()
const User = require('../../../db/user')

router.get('/user/info', async function (ctx, next) {
  ctx.body = User.getObject(ctx.identity)
})

module.exports = app.use(router.routes())
