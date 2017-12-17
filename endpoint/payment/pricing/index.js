const Koa = require('koa')
const router = require('koa-router')()
const config = require('../../../config.json')
const app = new Koa()

router.get('/payment/pricing', async function (ctx, next) {
  ctx.body = config.pricing
})

module.exports = app.use(router.routes())
