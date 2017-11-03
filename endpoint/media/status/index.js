const Koa = require('koa')
const router = require('koa-router')()
const Media = require('../../../db/media')
const app = new Koa()

router.get('/media/status/:id', async function (ctx) {
  const { id } = ctx.params

  ctx.assert(id != null, 400, 'Id is required')
  ctx.assert(/^[0-9a-fA-F]{24}$/.test(id), 400, 'Invalid media id')

  const media = await Media.findById(id)
  ctx.assert(media != null, 404, 'Requested media is not found')
  ctx.assert(!media.expired, 404, media.note || 'Requested media is expired')

  ctx.body = media
})

module.exports = app.use(router.routes())
