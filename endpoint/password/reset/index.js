const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const User = require('../../../db/user')

router.post('/user/password/reset', bodyParser(), async function (ctx, next) {
  const { userId, pinCode, newPassword } = ctx.request.body
  const { t } = ctx

  ctx.assert(userId != null, 400, t('Invalid user id'))
  ctx.assert(newPassword != null && newPassword.length >= 6,
    400, t('Password is too short, it must be at least 6 characters'))

  const user = await User.findById(userId)
  ctx.assert(user != null, 404, t('Sorry, this user is not registered'))

  const pin = await User.getResetPasswordPin(user)
  ctx.assert(pin && pin.code === ~~pinCode, 400, t('Invalid reset pin code'))

  await User.update(userId, {
    password: await User.hashPassword(newPassword)
  })

  // remove pin
  User.removeResetPasswordPin(user)

  ctx.body = {}
})

module.exports = app.use(router.routes())
