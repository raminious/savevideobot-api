'use strict'

const router = require('koa-router')()
const config = require('../../../config.json')

router.get('/client/version', function* (next) {

  const platform = this.client.platform
  this.assert(['mobile', 'web', 'telegram'].indexOf(platform) > -1, 400, 'Invalid Platform')

  const os = this.client.os
  this.assert(['ios', 'android'].indexOf(os) > -1, 400, 'Invalid os')

  // get minimum version acceptable by api
  const minVersion = config.clients[platform][os].min.split('.')

  const version = this.client.version.split('.')
  const major = version[0]
  const minor = version[1]
  const patch = version[2]

  if (
    (major < minVersion[0]) ||
    (major === minVersion[0] && minor < minVersion[1]) ||
    (major === minVersion[0] && minor === minVersion[1] && patch < minVersion[2])
  ){
    this.status = 426
  }

  this.body = {}
})

module.exports = require('koa')().use(router.routes())
