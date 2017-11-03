const Koa = require('koa')
const router = require('koa-router')()
const Media = require('../../../db/media')
const app = new Koa()

router.get('/media/list', async function (ctx) {
  const { query } = ctx.request
  const start = query.start || 0
  let limit = query.limit || 50

  if (limit > 50) {
    limit = 50
  }

  const criteria = {
    user_id: ctx.identity._id
  }

  ctx.body = {
    list: await Media.find(criteria, start, limit),
    total: await Media.total(criteria)
  }
})

module.exports = app.use(router.routes())
