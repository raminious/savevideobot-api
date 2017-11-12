const Koa = require('koa')
const AccessToken = require('../../db/access-token')
const config = require('../../config.json')

const app = new Koa()
const tokenPattern = /^[0-9a-zA-Z+/]{32}$/

const authentication = async function (ctx, next) {
  const token = ctx.headers['access-token']
  const platform = ctx.headers['app-platform']
  const os = ctx.headers['app-os']
  const version = ctx.headers['app-version']

  // do not validate svb downloaders
  if (platform === 'svb-downloader' &&
    ctx.headers['username'] === config.auth.username &&
    ctx.headers['passwrod'] === config.auth.passwrod
  ) {
    ctx.identity = { role: 'admin' }
    return await next()
  }

  // check params
  ctx.assert(token != null, 401, 'SaveVideoBot.com')
  ctx.assert(tokenPattern.test(token), 401, 'the access-token header should match ' + tokenPattern)

  // verify access token
  const user = await AccessToken.find(token, platform)
  ctx.assert(user != null, 401, 'Invalid access-token')

  // make client info global
  ctx.client = { platform, os, version }
  ctx.identity = user

  return await next()
}

module.exports = app.use(authentication)
