const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const moment = require('moment')
const app = new Koa()
const User = require('../../../db/user')
const sendMail = require('../../../services/email')
const Telegram = require('../../../services/telegram')
const config = require('../../../config.json')

router.post('/user/password/forget', bodyParser(), async function (ctx, next) {
  const { email, sendTo } = ctx.request.body

  ctx.assert(email != null, 400, 'Invalid email')

  const user = await User.find({ email })
  ctx.assert(user != null, 404, 'Sorry, that email address is not registered with us.')

  if (sendTo === 'telegram') {
    ctx.assert(user.telegram_id != null, 400, 'There isn\'t any connected Telegram account.')
  }

  const lastToken = await User.getResetPasswordPin(user)

  // resend reset password every 180s to avoid trolling
  if (lastToken && lastToken.id === user._id && sendTo === 'email') {
    const lastSent = moment().format('X') -  lastToken.time
    ctx.assert(lastSent > 180, 400, 'We recently sent you an email. check your inbox.')
  }

  // create reset code
  const resetCode = User.getRandomNumber()

  let isComposed

  if (sendTo === 'telegram') {
    isComposed = await Telegram.sendMessage(user.telegram_id,
      'You have been requested to reset your password.\n\n' +
      `The reset pin code is <b>${resetCode}</b>`
    )
  } else {
    isComposed = await sendMail(email, {
      subject: 'SaveVideoBot - Reset Password',
      layout: 'password-reset',
      code: resetCode,
      link: `${config.domain}/reset-password/${user._id}/${resetCode}`,
    })
  }

  ctx.assert(isComposed != null, 400, 'We could not send reset pin code. try again.')

  // save the reset password pin
  User.createResetPasswordPin(user, resetCode)

  ctx.body = {
    userId: user._id
  }
})

module.exports = app.use(router.routes())
