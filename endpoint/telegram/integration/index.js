const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const _ = require('underscore')

const app = new Koa()

router.post('/telegram/integrate', bodyParser(), async function (ctx, next) {

  ctx.assert(ctx.is('json'), 415, 'content type should be json')

  ctx.body = {}
})

module.exports = app.use(router.routes())