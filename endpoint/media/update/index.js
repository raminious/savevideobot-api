const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Media = require('../../../db/media')
const _ = require('underscore')
const app = new Koa()

router.post('/media/update/:id', bodyParser(), async function (ctx) {
	// check request type is json
  ctx.assert(ctx.is('json'), 415, 'content type should be json')

	// check access permission
	ctx.assert(User.isAdmin(ctx.identity), 401, 'Unauthorized')

	const _id = ctx.params.id
	ctx.assert(_id != null, 400, 'Id is required')
	ctx.assert(/^[0-9a-fA-F]{24}$/.test(_id), 400, 'Invalid media id')

	const attributes = ctx.request.body
	ctx.assert(_.isEmpty(attributes) == false, 400, 'No attributes to update')

	// update media
	await Media.update({ _id }, attributes)

	ctx.body = {}
})

module.exports = app.use(router.routes())
