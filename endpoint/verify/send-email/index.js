const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const moment = require('moment')
const app = new Koa()
const User = require('../../../db/user')
const sendMail = require('../../../services/email')
const config = require('../../../config.json')

router.post('/user/email/send-verification', bodyParser(), async function (ctx, next) {
  const { t } = ctx

  const user = await User.findById(ctx.identity.user_id)
  ctx.assert(user != null, 404, t('Invalid user id'))
  ctx.assert(user.email_confirmed !== true, 400, t('This email is already confirmed'))

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
    link: `${config.domain}/dashboard/settings/confirm/email/${verificationCode}`,
  })

  ctx.assert(isComposed != null, 400, t('We could not send verification code, try again'))

  // save the verify code
  User.createEmailVerificationPin(user, verificationCode)

  ctx.body = {}
})

module.exports = app.use(router.routes())
