const Koa = require('koa')
const router = require('koa-router')()
const agent = require('superagent')
const bodyParser = require('koa-bodyparser')
const balancer = require('../../../util/balancer')
const Media = require('../../../db/media')
const dbLog = require('../../../db/log')
const app = new Koa()

const callbacks = ['url']
const urlPattern = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi

router.post('/media/explore', bodyParser(), async function(ctx) {

  // check content type is json
  ctx.assert(ctx.is('json'), 415, 'content type should be json')

  // get and check input url
  let { url } = ctx.request.body
  ctx.assert(url != null, 400, 'Url is required')

  // fetch link from url
  url = url.match(urlPattern)

  //check url is valid or not
  ctx.assert(url.length == 1, 406, 'Invalid Url Address')

  // get the url
  url = url[0].trim()

  // get callback (it's optional)
  const callback = ctx.request.body.callback || null

  // check callback parameters
  if (callback != null) {
    ctx.assert(callback.id != null && callback.type != null, 400, 'callback must have id and tp attributes')
    ctx.assert(callbacks.indexOf(callback.type) != -1, 400, 'callback type is invalid')

    if (callback.type == 'url') {
      ctx.assert(callback.hasOwnProperty('url'), 400, 'callback url is not defined')
      ctx.assert(urlPattern.test(callback.url), 400, 'callback url is not valid')
    }
  }

  // log user request in database
  dbLog.create(ctx.identity.user_id, 'explore', url)

  // get a server from balancer
  const server = await balancer.pop()

  // check whether url is dumped before
  let media = await Media.findByUrl(url)

  if (media && !media.expired) {
    ctx.body = media
    return true
  }

  // create new media
  media = await Media.create(url, ctx.identity.user_id, server.id, { status: 'queued'})

  // request for process and dump url
  try {
    await agent
      .post(server.url + '/explore')
      .retry(3)
      .send({
        id: media.id,
        url,
        callback
      })

    ctx.log('info', 'dump', { url, server: server.url })
    ctx.body = media
  }
  catch(e) {

    // if download is down
    if (e.response == null) {

      // inform balancer this server is down
      await balancer.down(server.id)

      // set manual response
      e.response = { statusCode: 403, text: e.message}

      ctx.log('fatal', 'downloader_down', {
        target: 'downloader',
        server: server.url,
        task: 'media/explore',
        url
      })
    }

    // remove media when can't send it to downloader
    await Media.remove(media.id)

    ctx.status = e.response.statusCode
    ctx.body = e.response.text
  }
})

module.exports = app.use(router.routes())
