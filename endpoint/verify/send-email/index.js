const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const moment = require('moment')
const app = new Koa()
const User = require('../../../db/user')
const sendMail = require('../../../services/email')
const config = require('../../../config.json')

router.post('/user/email/send-verification', bodyParser(), async function (ctx, next) {
  const { userId } = ctx.request.body

  ctx.assert(userId != null, 400, 'Invalid user id')

  const user = await User.findById(userId)
  ctx.assert(user != null, 404, 'Invalid user id')

  const lastToken = await User.getEmailVerificationPin(user)

  // resend reset password every 180s to avoid trolling
  if (lastToken && lastToken.id === user._id) {
    const lastSent = moment().format('X') -  lastToken.time
    ctx.assert(lastSent > 180, 400, 'We recently sent you an email. check your inbox.')
  }

  // create reset code
  const verificationCode = User.getRandomNumber()

  const isComposed = await sendMail(email, {
    subject: 'SaveVideoBot - Verify email',
    layout: 'verify-email',
    code: verificationCode,
    link: `${config.domain}/user/${user._id}/email/confirm/${resetCode}`,
  })

  ctx.assert(isComposed != null, 400, 'We could not send verification code. try again.')

  // save the verify code
  User.createEmailVerificationPin(user, resetCode)

  ctx.body = {}
})

module.exports = app.use(router.routes())
