const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const _ = require('underscore')
const User = require('../../../db/user')
const Media = require('../../../db/media')
const Log = require('../../../db/log')

const app = new Koa()

router.post('/telegram/integrate', bodyParser(), async function (ctx, next) {
  ctx.assert(ctx.is('json'), 415, 'content type should be json')
  const { userId } = ctx.request.body

  const user = await User.findById(userId)
  ctx.assert(user.telegram_id == null, 403, 'Your account has been integrated before.')

  // merge two accounts
  const telegramUser = await User.findById(ctx.identity.user_id)
  const mergedUser = Object.assign(
    user,
    _.omit(telegramUser, '_id', 'access_token')
  )

  // update user object
  await User.update(user._id, mergedUser)

  // remove merged account
  await User.remove(ctx.identity.user_id)

  // update user's media
  await Media.update({ user_id: ctx.identity.user_id }, { user_id: user._id })

  // update user's log
  Log.update({ user_id: ctx.identity.user_id }, { user_id: user._id })

  ctx.body = {}
})

module.exports = app.use(router.routes())
