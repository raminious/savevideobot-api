'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('svb-core/lib/user')
const _ = require('underscore')

// valid attributes can change
const validAttributes = ['localization', 'phone', 'country']
const localization = [ 'fa', 'ru', 'en', 'ar', 'es', 'it']

router.post('/user/profile', bodyParser(), function* (next) {

  this.assert(this.is('json'), 415, 'content type should be json')
  const attributes = _.pick(this.request.body, validAttributes)

  if (attributes.localization != null) {
    this.assert(localization.indexOf(attributes.localization) > -1, 400, 'Invalid language')
  }

  yield User.update(this.identity._id, attributes)

  this.body = {}
})

module.exports = require('koa')().use(router.routes())
