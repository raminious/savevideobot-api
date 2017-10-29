'use strict'

const router = require('koa-router')()
const Media = require('svb-core/lib/media')

router.get('/media/live', function* () {
  this.body = yield Media.live(50)
})

module.exports = require('koa')().use(router.routes())
