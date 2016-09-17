'use strict'

const router = require('koa-router')()
const Media = require('svb-core/lib/media')

router.get('/media/status/:id', function* () {

  const id = this.params.id
  this.assert(id != null, 400, 'Id is required')

  const media = yield Media.findById(id)
  this.assert(media != null && !media.expired, 404, 'Media is not found or expired')

  this.body = media
})

module.exports = require('koa')().use(router.routes())
