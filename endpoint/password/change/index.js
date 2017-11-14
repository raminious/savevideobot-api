const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const User = require('../../../db/user')

router.post('/user/password/change', bodyParser(), async function (ctx, next) {
  const { currentPassword, newPassword } = ctx.request.body

  ctx.assert(currentPassword != null, 400, 'Your current password is required')
  ctx.assert(newPassword != null && newPassword.length >= 6,
    400, 'Password is too short. it must be at least 6 characters.')

  const user = await User.findById(ctx.identity.user_id)
  ctx.assert(user != null, 404, 'Sorry, this user is not registered.')

  const isPasswordCorrect = await User.passwordValidation(currentPassword, user.password)
  ctx.assert(isPasswordCorrect === true, 400, 'Current password is not correct')

  await User.update(user._id, {
    password: await User.hashPassword(newPassword)
  })

  ctx.body = {}
})

module.exports = app.use(router.routes())
