'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const balancer = require('../../../util/balancer')
const Media = require('svb-core/lib/media')
const dbLog = require('svb-core/lib/log')

const agent = require('superagent')
require('superagent-retry')(agent)

const callbacks = ['url']
const urlPattern = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi

router.post('/media/explore', bodyParser(), function* () {

  // check content type is json
  this.assert(this.is('json'), 415, 'content type should be json')

  // get and check input url
  let url = this.request.body.url
  this.assert(url != null, 400, 'Url is required')

  // fetch link from url
  url = url.match(urlPattern)

  //check url is valid or not
  this.assert(url.length == 1, 406, 'Invalid Url Address')

  // get the url
  url = url[0].trim()

  // get callback (it's optional)
  const callback = this.request.body.callback || {}

  // check callback parameters
  if (callback != null) {
    this.assert(callback.type != null, 400, 'callback must have type attribute')
    this.assert(callbacks.indexOf(callback.type) != -1, 400, 'callback type is invalid')

    if (callback.type == 'url') {
      this.assert(callback.hasOwnProperty('url'), 400, 'callback url is not defined')
      this.assert(urlPattern.test(callback.url), 400, 'callback url is not valid')
    }
  }

  // log user request in database
  dbLog.create(this.identity._id, 'explore', url)

  // get a server from balancer
  const server = yield balancer()

  // check whether url is dumped before
  let media = yield Media.findByUrl(url)

  if (media && !media.expired) {
    this.body = media
    return true
  }

  // create new media
  media = yield Media.create(url, this.identity._id, server.id, { status: 'queued'})

  // request for process and dump url
  try {
    yield agent
      .post(server.url + '/explore')
      .retry(3)
      .send({
        id: media.id,
        url,
        callback
      })

    this.log('info', 'dump', { url, server: server.url })
    this.body = media
  }
  catch(e) {

    // if download is down
    if (e.response == null) {
      e.response = { statusCode: 403, text: e.message}

      this.log('fatal', 'downloader_down', {
        target: 'downloader',
        server: server.url,
        task: 'media/explore',
        url
      })
    }

    // remove media when can't send it to downloader
    yield Media.remove(media.id)

    this.status = e.response.statusCode
    this.body = e.response.text
  }
})

module.exports = require('koa')().use(router.routes())
