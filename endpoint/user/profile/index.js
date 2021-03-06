const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const _ = require('underscore')

const app = new Koa()

// valid attributes can change
const validAttributes = ['name', 'localization']
const localization = [ 'fa', 'ru', 'en', 'ar', 'es', 'it']

router.post('/user/profile', bodyParser(), async function (ctx, next) {
  ctx.assert(ctx.is('json'), 415, 'content type should be json')
  const attributes = _.pick(ctx.request.body, validAttributes)

  if (attributes.localization) {
    ctx.assert(localization.indexOf(attributes.localization) > -1, 400, ctx.t('Invalid language'))
  }

  await User.update(ctx.identity.user_id, attributes)

  ctx.body = {}
})

module.exports = app.use(router.routes())
