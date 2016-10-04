'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const moment = require('moment')
const _ = require('underscore')
const balancer = require('../../../util/balancer')
const Media = require('svb-core/lib/media')

// add retry plugin to superagent library
const agent = require('superagent')
require('superagent-retry')(agent)

const webhooks = ['telegram']
const callbacks = ['url']

router.post('/media/download/:id/:format', bodyParser(), function* () {

  this.assert(this.is('json'), 415, 'content type should be json')

  const id = this.params.id
  const format = this.params.format
  const webhook = this.request.body.webhook
  const callback = this.request.body.callback //optional

  this.assert(id != null, 400, 'Media id is required')
  this.assert(format != null, 400, 'Format is required')

  this.assert(webhook != null, 400, 'webhook is not defined')
  this.assert(webhook.hasOwnProperty('type'), 400, 'webhook type is not defined')
  this.assert(webhooks.indexOf(webhook.type) != -1, 400, 'webhook type is invalid')

  if (webhook.type == 'telegram') {
    this.assert(webhook.bot_token != null && webhook.user_id != null, 400, 'Invalid Telegram webhook properties')
  }

  // if callback is defined, validate it
  if (callback != null) {
    this.assert(callback.id != null && callback.type != null, 400, 'callback must have id and type attributes')
    this.assert(callbacks.indexOf(callback.type) != -1, 400, 'callback type is invalid')

    if (callback.type == 'url') {

      this.assert(callback.hasOwnProperty('url'), 400, 'callback url is not defined')
      this.assert(/(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/i.test(callback.url),
        400, 'callback url is not valid')
    }
  }

  // get media
  const media = yield Media.findById(id)

  // log lost or expired media requests
  if (media == null || media.expired) {
    this.log('info', 'media_404', {
      target: 'api',
      task: 'media/download',
      status: media == null? '404': 'expired'
    })
  }

  // media not found or expired
  this.assert(media != null && !media.expired, 406, 'Requested media is not found or expired')

  // get a server from balancer
  const server = yield balancer.pop(media.server_id || null)

  try {
    const response = yield agent
      .post(server.url + '/send')
      .retry(3)
      .send({
        id,
        format,
        webhook,
        callback
      })

    this.body = {
      request_id: response.body.id,
      server: server.id
    }
  }
  catch(e) {

    // if downloader is down
    if (e.response == null) {
      e.response = { statusCode: 403, text: e.message }
      this.log('fatal', 'downloader_down', {
        target: 'downloader',
        server: server.url,
        task: 'media/download',
        url: media.url,
        format
      })
    }

    // set response message
    this.status = e.response.statusCode
    this.body = e.response.text
  }
})

module.exports = require('koa')().use(router.routes())
