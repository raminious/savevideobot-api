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

  let filename = media.title + '.' + media.extension

  if (format != 'best') {
    const f = _.findWhere(media.formats, { id: ~~format })
    if (f != null) filename = media.title + '.' + f.ext
  }

  let response

  try {
    response = yield request
      .post(server.url + '/download/request')
      .send({ id, url: media.url, filename, format, webhook })
  }
  catch(e) {
    throw e
  }

  this.body = {
    request_id: response.body.id,
    server: server.id
  }
})

module.exports = require('koa')().use(router.routes())
