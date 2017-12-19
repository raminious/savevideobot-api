const Koa = require('koa')
const router = require('koa-router')()
const Media = require('../../../db/media')
const app = new Koa()

router.get('/media/live', async function (ctx) {
  const { since } = ctx.query
  ctx.body = await Media.live(since, 20)
})

module.exports = app.use(router.routes())
