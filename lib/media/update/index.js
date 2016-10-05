'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('svb-core/lib/user')
const Media = require('svb-core/lib/media')
const _ = require('underscore')

router.post('/media/update/:id', bodyParser(), function* () {

	// check request type is json
  this.assert(this.is('json'), 415, 'content type should be json')

	// check access permission
	this.assert(User.isAdmin(this.identity), 401, 'Unauthorized')

	const _id = this.params.id
	this.assert(_id != null, 400, 'Id is required')
	this.assert(/^[0-9a-fA-F]{24}$/.test(_id), 400, 'Invalid media id')

	const attributes = this.request.body
	this.assert(_.isEmpty(attributes) == false, 400, 'No attributes to update')

	// update media
	yield Media.update({ _id }, attributes)

	this.body = {}
})

module.exports = require('koa')().use(router.routes())
