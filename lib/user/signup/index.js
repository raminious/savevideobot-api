'use strict'

const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');
const Promise = require('bluebird');
const crypto = Promise.promisifyAll(require('crypto'));
const isemail = require('isemail');
const User = require('svb-core/lib/user');

router.post('/user/signup', bodyParser(), function* (next) {

  const email = this.request.body.email;
  const password = this.request.body.password;
})

module.exports = require('koa')().use(router.routes());
