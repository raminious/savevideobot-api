const koa = require('koa')
const app = koa()
const User = require('svb-core/lib/user')

const tokenPattern = /^[0-9a-zA-Z+/]{32}$/

const authentication = function* (next) {

  const token = this.headers['access-token']
  const platform = this.headers['app-platform']
  const os = this.headers['app-os']
  const version = this.headers['app-version']

  // check params
  this.assert(token != null, 401, 'SaveVideoBot.com')
  this.assert(tokenPattern.test(token), 401, 'the access-token header should match ' + tokenPattern)

  // verify access token
  const user = yield User.findByToken(token)
  this.assert(user != null, 401, 'invalid access-token')

  // make client info global
  this.client = {
  	platform,
  	os,
  	version
  }

  this.identity = user

  yield* next
}

module.exports = require('koa')().use(authentication)
