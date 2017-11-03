const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const isemail = require('isemail')
const User = require('../../../db/user')

const app = new Koa()

router.post('/user/signup', bodyParser(), async function (ctx, next) {
  const { name, email, password } = ctx.request.body

  ctx.assert(name != null && name.length >= 3, 400, 'Name is invalid')
  ctx.assert(email != null && isemail.validate(email), 400, 'Email is invalid')
  ctx.assert(password != null && password.length >= 6,
    400, 'Password is too short. it must be at least 6 characters.')

  let user = await User.find({
    email: email.trim().toLowerCase()
  })

  ctx.assert(user == null,
    400, 'An account with this email already exists, enter another email.')

  user = await User.create({ name, email, password })

  ctx.body = {
    name: user.name,
    token: user.access_token,
    username: user.username,
    email: user.email
  }
})

module.exports = app.use(router.routes())
