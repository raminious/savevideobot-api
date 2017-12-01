const Koa = require('koa')
const router = require('koa-router')()
const agent = require('superagent')
const bodyParser = require('koa-bodyparser')
const moment = require('moment')
const _ = require('underscore')
const balancer = require('../../../util/balancer')
const Media = require('../../../db/media')
const app = new Koa()

const webhooks = ['telegram']
const callbacks = ['url']

router.post('/media/download/:id/:format', bodyParser(), async function (ctx) {
  ctx.assert(ctx.is('json'), 415, 'content type should be json')

  const { id, format } = ctx.params
  const { webhook, callback } = ctx.request.body

  ctx.assert(id != null, 400, 'Media id is required')
  ctx.assert(format != null, 400, 'Format is required')

  ctx.assert(webhook != null, 400, 'Webhook is not defined')
  ctx.assert(webhook.hasOwnProperty('type'), 400, 'Webhook type is not defined')
  ctx.assert(webhooks.indexOf(webhook.type) != -1, 400, 'Webhook type is invalid')

  if (webhook.type == 'telegram') {
    ctx.assert(webhook.bot_token != null && webhook.user_id != null, 400, 'Invalid Telegram webhook properties')
  }

  // if callback is defined, validate it
  if (callback != null) {
    ctx.assert(callback.id != null && callback.type != null, 400, 'Callback must have id and type attributes')
    ctx.assert(callbacks.indexOf(callback.type) != -1, 400, 'Callback type is invalid')

    if (callback.type == 'url') {

      ctx.assert(callback.hasOwnProperty('url'), 400, 'callback url is not defined')
      ctx.assert(/(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/i.test(callback.url),
        400, 'callback url is not valid')
    }
  }

  // get media
  const media = await Media.findById(id)

  // log lost or expired media requests
  if (media == null || media.expired) {
    ctx.log('info', 'media_404', {
      target: 'api',
      task: 'media/download',
      status: media == null ? '404' : 'expired'
    })
  }

  // media not found or expired
  ctx.assert(media != null && !media.expired,
    406, ctx.t('Requested media is not found or expired'))

  // get a server from balancer
  const server = await balancer.pop(media.server_id || null)

  try {
    const response = await agent
      .post(server.url + '/send')
      .retry(3)
      .send({
        id,
        format,
        webhook,
        callback
      })

    ctx.body = {
      request_id: response.body.id,
      server: server.id
    }
  }
  catch(e) {
    // if downloader is down
    if (e.response == null) {
      e.response = { statusCode: 403, text: e.message }
      ctx.log('fatal', 'downloader_down', {
        target: 'downloader',
        server: server.url,
        task: 'media/download',
        url: media.url,
        format
      })
    }

    // set response message
    ctx.status = e.response.statusCode
    ctx.body = e.response.text
  }
})

module.exports = app.use(router.routes())
