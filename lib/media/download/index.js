'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const request = require('superagent')
const moment = require('moment')
const _ = require('underscore')
const balancer = require('../../../util/balancer')
const Media = require('svb-core/lib/media')

// add retry plugin to superagent library
require('superagent-retry')(request)

router.post('/media/download/:id/:format', bodyParser(), function* () {

  this.assert(this.is('json'), 415, 'content type should be json')

  const id = this.params.id
  const format = this.params.format
  const webhook = this.request.body.webhook || null

  this.assert(id != null, 400, 'Media id is required')
  this.assert(format != null, 400, 'Format is required')

  // get media
  const media = yield Media.findById(id)

  // media not found or expired
  this.assert(media != null && !media.expired,
    406, 'This request is expired or not found\nSend another video url to continue')

  // get a server from balancer
  const server = yield balancer(media.server_id || null)

  // set default debug info
  const log_info = {
    target: 'downloader',
    server: server.url,
    task: 'media/send',
    url: media.url,
    site: media.site,
    format
  }

  try {
    const response = yield request
      .post(server.url + '/send')
      .retry(3)
      .send({
        id,
        format,
        webhook
      })

    // log request
    this.log('info', 'api_media_download', log_info)

    this.body = {
      request_id: response.body.id,
      server: server.id
    }
  }
  catch(e) {

    if (e.response == null)
      e.response = { text: 'server timeout' }

    const message = e.response.text || e.code || e.errorno
    this.log('error', message, log_info)

    // set response message
    this.status = e.response.statusCode || 406
    this.body = e.response.text
  }
})

module.exports = require('koa')().use(router.routes())
