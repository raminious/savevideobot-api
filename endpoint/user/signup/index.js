const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const isemail = require('isemail')
const moment = require('moment')
const User = require('../../../db/user')
const AccessToken = require('../../../db/access-token')
const Email = require('../../../util/email')
const app = new Koa()

router.post('/user/signup', bodyParser(), async function (ctx, next) {
  const { name, email, password } = ctx.request.body
  const { t } = ctx

  const platform = ctx.headers['app-platform']
  ctx.assert(platform != null, 400, t('Invalid platform'))

  // check name
  ctx.assert(name && name.length >= 2, 400, t('Name is invalid'))

  ctx.assert(password && password.length >= 6,
    400, t('Password is too short, it must be at least 6 characters'))

  // normalize email
  ctx.assert(email && isemail.validate(email), 400, t('Email is invalid'))

  const isDisposable = await Email.isDisposable(email)
  ctx.assert(isDisposable === false, 400, t('You are not allowed to use temporary emails'))

  // normalize email address
  const normalizedEmail = Email.normalize(email)

  let user = await User.find({
    email: normalizedEmail
  })

  ctx.assert(user == null, 400, t('An account with this email already exists, enter another email'))

  user = await User.create({
    name: name,
    email: normalizedEmail,
    password: password,
    subscription: moment().add(5, 'days').format()
  })

  // create new access token
  const access = await AccessToken.create(user._id, platform)

  ctx.body = User.getObject(user, {
    access_token: access.token
  })
})

module.exports = app.use(router.routes())
