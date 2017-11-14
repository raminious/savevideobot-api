const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const User = require('../../../db/user')

router.post('/user/email/verify', bodyParser(), async function (ctx, next) {
  const { userId, code } = ctx.request.body

  ctx.assert(userId != null, 400, 'Invalid user id')

  const user = await User.findById(userId)
  ctx.assert(user != null, 404, 'Sorry, this user is not registered.')

  const pin = await User.getEmailVerificationPin(user)
  ctx.assert(pin && pin.code === ~~code, 400, 'Entered verification code is wrong')

  await User.update(userId, {
    email_confirmed: true
  })

  // remove pin
  User.removeEmailVerificationPin(user)

  ctx.body = {}
})

module.exports = app.use(router.routes())
