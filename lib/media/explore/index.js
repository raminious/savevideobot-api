'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const request = require('superagent')
const balancer = require('../../../util/balancer')
const Media = require('svb-core/lib/media')
const dbLog = require('svb-core/lib/log')
const check = require('../../filters')('porn')

const urlPattern = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi

router.post('/media/explore', bodyParser(), function* () {

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

  // log user request in database
  dbLog.create(this.identity._id, 'explore', url)

  // get a server from balancer
  const server = yield balancer()

  // check whether url exists in database
  const media = yield Media.findByUrl(url)

  if (media != null) {
    this.body = media
    return true
  }

  // set default debug info
  const log_info = { target: 'downloader', server: server.url, task: 'media/explore', url }
  let response = null

  try {

    response = yield request
      .post(server.url + '/explore')
      .send({ url: url })

    // log request
    this.log('info', 'api_media_info', log_info)
  }
  catch (e) {

    if (e.response == null)
      e.response = { body: { description: 'server timeout'}}

    const message = e.response.body.description || e.response.statusCode || 'downloader_sucks'
    e.response && Object.assign(log_info, {description: e.response.body || e.response.text })
    this.log('error', message, log_info)

    // set response message
    this.status = e.response.statusCode || 406
    this.body = e.response.body.description

    return false
  }

  // filter porn request
  check.porn.call(this, response.body.site, response.body.title, url)

  this.body = yield Media.create(url, this.identity._id, server.id, response.body)
})

module.exports = require('koa')().use(router.routes())
