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

    if (lastSent <= 300) {
      ctx.body = {}
      return true
    }
  }

  // create reset code
  const verificationCode = User.getRandomNumber()

  const isComposed = await sendMail(user.email, {
    subject: 'SaveVideoBot - Verify email',
    layout: 'email-verify',
    code: verificationCode,
    link: `${config.domain}/user/${user._id}/email/confirm/${verificationCode}`,
  })

  ctx.assert(isComposed != null, 400, 'We could not send verification code. try again.')

  // save the verify code
  User.createEmailVerificationPin(user, verificationCode)

  ctx.body = {}
})

module.exports = app.use(router.routes())
