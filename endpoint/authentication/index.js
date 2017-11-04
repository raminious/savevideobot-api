const Koa = require('koa')
const User = require('../../db/user')

const app = new Koa()
const tokenPattern = /^[0-9a-zA-Z+/]{32}$/

const authentication = async function (ctx, next) {
  const token = ctx.headers['access-token']
  const platform = ctx.headers['app-platform']
  const os = ctx.headers['app-os']
  const version = ctx.headers['app-version']

  // check params
  ctx.assert(token != null, 401, 'SaveVideoBot.com')
  ctx.assert(tokenPattern.test(token), 401, 'the access-token header should match ' + tokenPattern)

  // verify access token
  const user = await User.findByToken(token)
  ctx.assert(user != null, 401, 'invalid access-token')

  // make client info global
  ctx.client = { platform, os, version }
  ctx.identity = user

  return await next()
}

module.exports = app.use(authentication)
