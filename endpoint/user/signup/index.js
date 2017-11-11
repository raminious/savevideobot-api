const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const isemail = require('isemail')
const User = require('../../../db/user')
const Email = require('../../../util/email')
const app = new Koa()

router.post('/user/signup', bodyParser(), async function (ctx, next) {
  const { name, email, password } = ctx.request.body

  ctx.assert(name != null && name.length >= 3, 400, 'Name is invalid')

  ctx.assert(password != null && password.length >= 6,
    400, 'Password is too short. it must be at least 6 characters.')

  // normalize email
  ctx.assert(email != null && isemail.validate(email), 400, 'Email is invalid')

  const isDisposable = await Email.isDisposable(email)
  ctx.assert(isDisposable === false, 400, 'You are not allowed to use temporary emails')

  // normalize email address
  const normalizedEmail = Email.normalize(email)

  let user = await User.find({
    email: normalizedEmail
  })

  ctx.assert(user == null,
    400, 'An account with this email already exists, enter another email.')

  user = await User.create({
    name: name,
    email: normalizedEmail,
    password: password
  })

  ctx.body = User.getObject(user)
})

module.exports = app.use(router.routes())
