'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const Media = require('svb-core/lib/media')
const _ = require('underscore')

router.post('/media/update/:id', bodyParser(), function* () {

	// check request type is json
  this.assert(this.is('json'), 415, 'content type should be json')

	// check access permission
	this.assert(this.identity.admin, 401, 'Unauthorized')

	const _id = this.params.id
	this.assert(_id != null, 400, 'Id is required')

	const attributes = this.request.body
	this.assert(_.isEmpty(attributes) == false, 400, 'No attributes to update')

	// update media
	yield Media.update({ _id }, attributes)

	this.body = {}
})

module.exports = require('koa')().use(router.routes())
