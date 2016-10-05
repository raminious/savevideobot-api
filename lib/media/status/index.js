'use strict'

const router = require('koa-router')()
const Media = require('svb-core/lib/media')

router.get('/media/status/:id', function* () {

  const id = this.params.id
  this.assert(id != null, 400, 'Id is required')
  this.assert(/^[0-9a-fA-F]{24}$/.test(id), 400, 'Invalid media id')

  const media = yield Media.findById(id)
  this.assert(media != null && !media.expired, 404, 'Requested media is not found or expired')

  this.body = media
})

module.exports = require('koa')().use(router.routes())
