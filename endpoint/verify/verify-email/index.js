const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const moment = require('moment')
const app = new Koa()
const User = require('../../../db/user')

router.post('/user/email/verify', bodyParser(), async function (ctx, next) {
  const { code } = ctx.request.body
  const { t } = ctx

  const user = await User.findById(ctx.identity.user_id)
  ctx.assert(user != null, 404, t('Sorry, this user is not registered'))
  ctx.assert(user.email_confirmed !== true, 400, 'This email is already confirmed')

  const pin = await User.getEmailVerificationPin(user)
  ctx.assert(pin && pin.code === ~~code, 400, t('Entered verification code is wrong'))

  // calculate new subscription
  const increaseDays = 7
  const subscription = User.increaseSubscription(user, increaseDays)

  await User.update(user._id, {
    email_confirmed: true,
    subscription
  })

  // remove pin
  User.removeEmailVerificationPin(user)

  ctx.body = {
    email_confirmed: true,
    increaseDays,
    subscription
  }
})

module.exports = app.use(router.routes())
