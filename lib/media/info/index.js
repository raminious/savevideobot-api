'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const request = require('superagent')
const balancer = require('../../../util/balancer')
const Media = require('svb-core/lib/media')
const PornDetect = require('../../filters/porn')

const urlPattern = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi

router.post('/media/info', bodyParser(), function* () {

  this.assert(this.is('json'), 415, 'content type should be json')

  // get and check input url
  let url = this.request.body.url
  this.assert(url != null, 400, 'Url is required')

  // fetch link from url
  url = url.match(urlPattern)

  //check url is valid or not
  this.assert(url.length === 1, 404, 'Invalid Url Address')

  // get the url
  url = url[0]

  // get a server from balancer
  const server = yield balancer()

  let response = null

  // check whether url exists in database
  response = yield Media.findByUrl(url)

  if (response != null) {
    this.body = response
    return true
  }

  // set default debug info
  const info = {
    target: 'downloader',
    server: server.url,
    task: 'media/info',
    url: url
  }

  // get media information
  try {

    // log request
    this.log('info', 'api_media_info', info)

    response = yield request
      .post(server.url + '/download/info')
      .send({ url: url })
  }
  catch (e) {
    const message = e.code || e.errorno || 'downloader_sucks'
    e.response && Object.assign(info, e.response.body)

    throw { message, info }
  }

  // filter porn request
  let site = response.body.site
  let title = response.body.title

  let isPorn = PornDetect(site, title)

  if (isPorn) {

    this.log('report', 'porn', { site, title, url})

    this.status = 206
    this.body = [
      'We are so sorry, You are not able to download pornographic contents\n',
      'Website: ' + response.body.site,
      'Title: ' + response.body.title
    ].join('\n')

    return false
  }

  response.body = yield Media.create(url, this.identity._id, response.body)

  this.status = response.status
  this.body = response.body

})

module.exports = require('koa')().use(router.routes())
