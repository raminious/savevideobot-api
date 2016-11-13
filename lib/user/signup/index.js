'use strict'

const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const Promise = require('bluebird')
const crypto = Promise.promisifyAll(require('crypto'))
const isemail = require('isemail')
const User = require('svb-core/lib/user')

router.post('/user/signup', bodyParser(), function* (next) {

  const name = this.request.body.name
  const email = this.request.body.email
  const password = this.request.body.password

  this.assert(name != null && name.length >= 3, 400, 'Name is invalid')
  this.assert(email != null && isemail.validate(email), 400, 'Email is invalid')
  this.assert(password != null && password.length >= 6, 400, 'Password is too short. it must be at least 6 characters.')

  let user = yield User.find({ email: email.trim().toLowerCase() })
  this.assert(user == null, 400, 'An account with this email already exists, enter another email.')

  user = yield User.create({ name, email, password })

  this.body = {
    name: user.name,
    token: user.access_token,
    username: user.username,
    email: user.email
  }
})

module.exports = require('koa')().use(router.routes())
