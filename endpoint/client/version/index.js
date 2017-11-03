const Koa = require('koa')
const router = require('koa-router')()
const config = require('../../../config.json')
const app = new Koa()

router.get('/client/version', async function (ctx, next) {

  const { platform, os } = ctx.client
  ctx.assert(['mobile', 'web', 'telegram'].indexOf(platform) > -1, 400, 'Invalid Platform')
  ctx.assert(['ios', 'android'].indexOf(os) > -1, 400, 'Invalid os')

  // get minimum version acceptable by api
  const minVersion = config.clients[platform][os].min.split('.')

  const version = ctx.client.version.split('.')
  const major = version[0]
  const minor = version[1]
  const patch = version[2]

  if (
    (major < minVersion[0]) ||
    (major === minVersion[0] && minor < minVersion[1]) ||
    (major === minVersion[0] && minor === minVersion[1] && patch < minVersion[2])
  ){
    ctx.status = 426
  }

  ctx.body = {}
})

module.exports = app.use(router.routes())
