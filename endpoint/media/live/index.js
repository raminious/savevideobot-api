const Koa = require('koa')
const router = require('koa-router')()
const Media = require('../../../db/media')
const app = new Koa()

router.get('/media/live', async function (ctx) {
  ctx.body = await Media.live(50)
})

module.exports = app.use(router.routes())
