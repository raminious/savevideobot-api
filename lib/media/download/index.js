'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const request = require('superagent')
const _ = require('underscore')
const balancer = require('../../../util/balancer')
const Media = require('svb-core/lib/media')

router.post('/media/download', bodyParser(), function* () {

  this.assert(this.is('json'), 415, 'content type should be json')

  const id = this.request.body.id
  this.assert(id != null, 400, 'Media id is required')

  // get input arguments
  const format = this.request.body.format || 'best'
  const webhook = this.request.body.webhook || null

  // get a server from balancer
  const server = yield balancer(this.request.body.srv || null)

  // get media
  const media = yield Media.findById(id)

  // media not found or expired
  if (media == null || moment(media.expire_at).isAfter(moment())) {
    this.status = 206
    this.body = ''
    return false
  }

  let filename = media.title + '.' + media.extension

  if (format != 'best') {
    const f = _.findWhere(media.formats, { id: ~~format })
    if (f != null) filename = media.title + '.' + f.ext
  }

  // set default debug info
  const info = {
    target: 'downloader',
    server: server.url,
    task: 'media/download',
    url: media.url,
    site: media.site,
    format
  }

  let response

  try {

    // log request
    this.log('info', 'api_media_download', info)

    response = yield request
      .post(server.url + '/download/request')
      .send({ id, url: media.url, filename, format, webhook })
  }
  catch(e) {
    const message = e.response || e.code || e.errorno
    throw { message, info }
  }

  this.body = {
    request_id: response.body.id,
    server: server.id
  }
})

module.exports = require('koa')().use(router.routes())
