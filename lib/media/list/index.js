'use strict'

const router = require('koa-router')()
const Media = require('svb-core/lib/media')

router.get('/media/list', function* () {

  const start = this.request.query.start || 0
  let limit = this.request.query.limit || 50

  if (limit > 50) {
    limit = 50
  }

  const criteria = {
    user_id: this.identity._id
  }

  this.body = {
    list: yield Media.find(criteria, start, limit),
    total: yield Media.total(criteria)
  }
})

module.exports = require('koa')().use(router.routes())
