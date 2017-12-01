const Koa = require('koa')
const router = require('koa-router')()
const ratelimit = require('koa-ratelimit')
const Statistics = require('../../../db/statistics')
const redis = require('../../../adapters/redis')
const app = new Koa()

const ratelimitConfig = {
  db: redis,
  duration: 60 * 1000,
  id: (ctx) => ctx.ip,
  max: 15
}

router.get('/statistics/downloads', ratelimit(ratelimitConfig), async function (ctx, next) {
  const statistics = await Statistics.report()

  ctx.body = {
    total: statistics.explore + 52000000
  }
})

module.exports = app.use(router.routes())
