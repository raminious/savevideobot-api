const Koa = require('koa')
const router = require('koa-router')()
const config = require('../../../config.json')
const app = new Koa()

router.get('/client/version', async function (ctx, next) {
  const platform = ctx.headers['app-platform']
  const os = ctx.headers['app-os']
  const version = ctx.headers['app-version']

  ctx.assert(['mobile'].indexOf(platform) > -1, 400, 'Invalid Platform')
  ctx.assert(['android'].indexOf(os) > -1, 400, 'Invalid os')

  // default app status
  let status = 200

  // get minimum version acceptable by api
  const minVersion = config.clients[platform][os].min.split('.')

  const clientVersion = version.split('.')
  const major = clientVersion[0]
  const minor = clientVersion[1]
  const patch = clientVersion[2]

  if (
    (major < minVersion[0]) ||
    (major === minVersion[0] && minor < minVersion[1]) ||
    (major === minVersion[0] && minor === minVersion[1] && patch < minVersion[2])
  ) {
    status = 426
  }

  // get latest version of app
  const latestVersion = config.clients[platform][os].latest

  ctx.status = status

  ctx.body = {
    version: latestVersion,
    marketUrl: null,
    directUrl: `${config.domain}/static/app/android/savevideobot-${latestVersion}.apk`
  }
})

module.exports = app.use(router.routes())
